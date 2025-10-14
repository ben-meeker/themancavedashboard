package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type TeslaResponse struct {
	BatteryLevel     int     `json:"batteryLevel"`
	ChargingState    string  `json:"chargingState"`
	IsCharging       bool    `json:"isCharging"`
	EstimatedRange   float64 `json:"estimatedRange"`
	ChargeLimit      int     `json:"chargeLimit"`
	TimeToFullCharge float64 `json:"timeToFullCharge"`
}

type TessieAPIResponse struct {
	ChargeState struct {
		BatteryLevel         int     `json:"battery_level"`
		ChargingState        string  `json:"charging_state"`
		ChargeEnergyAdded    float64 `json:"charge_energy_added"`
		ChargerVoltage       int     `json:"charger_voltage"`
		ChargerPilotCurrent  int     `json:"charger_pilot_current"`
		ChargerActualCurrent int     `json:"charger_actual_current"`
		ChargePortDoorOpen   bool    `json:"charge_port_door_open"`
		EstBatteryRange      float64 `json:"est_battery_range"`
		UsableBatteryLevel   int     `json:"usable_battery_level"`
		ChargeCurrentRequest int     `json:"charge_current_request"`
		ChargeLimit          int     `json:"charge_limit_soc"`
		TimeToFullCharge     float64 `json:"time_to_full_charge"`
		MinutesToFullCharge  int     `json:"minutes_to_full_charge"`
	} `json:"charge_state"`
}

func getTeslaStatus(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	apiKey := cfg.Tesla.APIKey
	vin := cfg.Tesla.VIN

	if apiKey == "" || vin == "" {
		http.Error(w, `{"error":"Tessie API not configured"}`, http.StatusServiceUnavailable)
		return
	}

	url := fmt.Sprintf("https://api.tessie.com/%s/state", vin)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, `{"error":"Failed to create request"}`, http.StatusInternalServerError)
		return
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch Tesla data"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, `{"error":"Failed to read response"}`, http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf(`{"error":"Tessie API error: %s"}`, string(body)), resp.StatusCode)
		return
	}

	var tessieData TessieAPIResponse
	if err := json.Unmarshal(body, &tessieData); err != nil {
		http.Error(w, `{"error":"Failed to parse Tesla data"}`, http.StatusInternalServerError)
		return
	}

	// Transform to frontend format
	response := TeslaResponse{
		BatteryLevel:     tessieData.ChargeState.BatteryLevel,
		ChargingState:    tessieData.ChargeState.ChargingState,
		IsCharging:       tessieData.ChargeState.ChargingState == "Charging",
		EstimatedRange:   tessieData.ChargeState.EstBatteryRange,
		ChargeLimit:      tessieData.ChargeState.ChargeLimit,
		TimeToFullCharge: tessieData.ChargeState.TimeToFullCharge,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
