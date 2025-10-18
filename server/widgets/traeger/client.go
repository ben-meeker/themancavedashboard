package traeger

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/google/uuid"
)

const (
	ClientID = "2fuohjtqv1e63dckp5v84rau0j"
	Timeout  = 10 * time.Second
)

type TraegerClient struct {
	Username       string
	Password       string
	MqttUUID       string
	MqttURL        string
	MqttClient     mqtt.Client
	GrillStatus    map[string]interface{}
	Token          string
	TokenExpires   int64
	MqttURLExpires int64
	GrillCallbacks map[string][]func()
	Grills         []interface{}
	mu             sync.RWMutex
}

func NewTraegerClient(username, password string) *TraegerClient {
	return &TraegerClient{
		Username:       username,
		Password:       password,
		MqttUUID:       uuid.New().String(),
		GrillStatus:    make(map[string]interface{}),
		GrillCallbacks: make(map[string][]func()),
	}
}

func (t *TraegerClient) TokenRemaining() int64 {
	return t.TokenExpires - time.Now().Unix()
}

func (t *TraegerClient) DoCognito(ctx context.Context) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"ClientMetadata": map[string]interface{}{},
		"AuthParameters": map[string]interface{}{
			"PASSWORD": t.Password,
			"USERNAME": t.Username,
		},
		"AuthFlow": "USER_PASSWORD_AUTH",
		"ClientId": ClientID,
	}
	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://cognito-idp.us-west-2.amazonaws.com/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/x-amz-json-1.1")
	req.Header.Set("X-Amz-Date", time.Now().UTC().Format("20060102T150405Z"))
	req.Header.Set("X-Amz-Target", "AWSCognitoIdentityProviderService.InitiateAuth")

	client := &http.Client{Timeout: Timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	return result, nil
}

func (t *TraegerClient) RefreshToken(ctx context.Context) error {
	if t.TokenRemaining() < 60 {
		requestTime := time.Now().Unix()
		response, err := t.DoCognito(ctx)
		if err != nil {
			return err
		}
		authResult := response["AuthenticationResult"].(map[string]interface{})
		t.TokenExpires = int64(authResult["ExpiresIn"].(float64)) + requestTime
		t.Token = authResult["IdToken"].(string)
	}
	return nil
}

func (t *TraegerClient) GetUserData(ctx context.Context) (map[string]interface{}, error) {
	err := t.RefreshToken(ctx)
	if err != nil {
		return nil, err
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://1ywgyc65d1.execute-api.us-west-2.amazonaws.com/prod/users/self", nil)
	req.Header.Set("Authorization", t.Token)
	client := &http.Client{Timeout: Timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	return result, nil
}

func (t *TraegerClient) SendCommand(ctx context.Context, thingName, command string) error {
	err := t.RefreshToken(ctx)
	if err != nil {
		return err
	}
	url := fmt.Sprintf("https://1ywgyc65d1.execute-api.us-west-2.amazonaws.com/prod/things/%s/commands", thingName)
	data := map[string]interface{}{"command": command}
	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", t.Token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept-Language", "en-us")
	req.Header.Set("User-Agent", "Traeger/11 CFNetwork/1209 Darwin/20.2.0")
	client := &http.Client{Timeout: Timeout}
	_, err = client.Do(req)
	return err
}

func (t *TraegerClient) UpdateState(ctx context.Context, thingName string) error {
	t.mu.Lock()
	delete(t.GrillStatus, thingName)
	t.mu.Unlock()

	err := t.SendCommand(ctx, thingName, "90")
	if err != nil {
		return err
	}

	// Wait for status update (with timeout)
	timeout := time.After(10 * time.Second)
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			return fmt.Errorf("timeout waiting for status update")
		case <-ticker.C:
			t.mu.RLock()
			hasStatus := t.GrillStatus[thingName] != nil
			t.mu.RUnlock()
			if hasStatus {
				return nil
			}
		}
	}
}

func (t *TraegerClient) UpdateGrills(ctx context.Context) error {
	data, err := t.GetUserData(ctx)
	if err != nil {
		return err
	}
	t.Grills = data["things"].([]interface{})
	return nil
}

func (t *TraegerClient) GetGrills() []interface{} {
	return t.Grills
}

func (t *TraegerClient) MqttURLRemaining() int64 {
	return t.MqttURLExpires - time.Now().Unix()
}

func (t *TraegerClient) RefreshMqttURL(ctx context.Context) error {
	err := t.RefreshToken(ctx)
	if err != nil {
		return err
	}
	if t.MqttURLRemaining() < 60 {
		mqttRequestTime := time.Now().Unix()
		req, _ := http.NewRequestWithContext(ctx, "POST", "https://1ywgyc65d1.execute-api.us-west-2.amazonaws.com/prod/mqtt-connections", nil)
		req.Header.Set("Authorization", t.Token)
		client := &http.Client{Timeout: Timeout}
		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		var result map[string]interface{}
		json.Unmarshal(body, &result)
		t.MqttURLExpires = int64(result["expirationSeconds"].(float64)) + mqttRequestTime
		t.MqttURL = result["signedUrl"].(string)
	}
	return nil
}

func (t *TraegerClient) GetMqttClient(onConnect mqtt.OnConnectHandler) (mqtt.Client, error) {
	if t.MqttClient == nil {
		err := t.RefreshMqttURL(context.Background())
		if err != nil {
			return nil, err
		}
		mqttURL, _ := url.Parse(t.MqttURL)
		opts := mqtt.NewClientOptions()
		opts.AddBroker(fmt.Sprintf("wss://%s%s?%s", mqttURL.Host, mqttURL.Path, mqttURL.RawQuery))
		opts.SetClientID(t.MqttUUID)
		opts.SetTLSConfig(&tls.Config{InsecureSkipVerify: true})
		opts.OnConnect = onConnect
		t.MqttClient = mqtt.NewClient(opts)
		if token := t.MqttClient.Connect(); token.Wait() && token.Error() != nil {
			return nil, token.Error()
		}
	}
	return t.MqttClient, nil
}

func (t *TraegerClient) GrillMessage(client mqtt.Client, msg mqtt.Message) {
	topic := msg.Topic()
	if len(topic) > len("prod/thing/update/") && topic[:len("prod/thing/update/")] == "prod/thing/update/" {
		grillID := topic[len("prod/thing/update/"):]
		var payload map[string]interface{}
		json.Unmarshal(msg.Payload(), &payload)
		t.mu.Lock()
		t.GrillStatus[grillID] = payload
		if callbacks, ok := t.GrillCallbacks[grillID]; ok {
			for _, callback := range callbacks {
				go callback()
			}
		}
		t.mu.Unlock()
	}
}

func (t *TraegerClient) GrillConnect(client mqtt.Client) {
	// Connection established, subscribe to all grills
}

func (t *TraegerClient) SubscribeToGrillStatus(ctx context.Context) error {
	client, err := t.GetMqttClient(t.GrillConnect)
	if err != nil {
		return err
	}
	for _, grill := range t.Grills {
		grillMap := grill.(map[string]interface{})
		thingName := grillMap["thingName"].(string)
		t.mu.Lock()
		delete(t.GrillStatus, thingName)
		t.mu.Unlock()
		client.Subscribe(fmt.Sprintf("prod/thing/update/%s", thingName), 1, t.GrillMessage)
	}
	return nil
}

func (t *TraegerClient) GetStateForDevice(thingName string) interface{} {
	t.mu.RLock()
	defer t.mu.RUnlock()
	if status, ok := t.GrillStatus[thingName]; ok {
		if statusMap, ok := status.(map[string]interface{}); ok {
			return statusMap["status"]
		}
	}
	return nil
}

func (t *TraegerClient) Start(ctx context.Context) error {
	err := t.UpdateGrills(ctx)
	if err != nil {
		return err
	}
	return t.SubscribeToGrillStatus(ctx)
}
