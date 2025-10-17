package tesla

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
)

// TeslaWidget handles Tesla vehicle data via Tessie API
type TeslaWidget struct {
	apiKey string
	vin    string
}

// TeslaResponse is the data sent to the frontend
type TeslaResponse struct {
	BatteryLevel     int     `json:"batteryLevel"`
	ChargingState    string  `json:"chargingState"`
	IsCharging       bool    `json:"isCharging"`
	EstimatedRange   float64 `json:"estimatedRange"`
	ChargeLimit      int     `json:"chargeLimit"`
	TimeToFullCharge float64 `json:"timeToFullCharge"`
}

// TessieAPIResponse is the response from Tessie API
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

// ID returns the widget identifier
func (w *TeslaWidget) ID() string {
	return "tesla"
}

// GetRequiredEnvVars returns required environment variables
func (w *TeslaWidget) GetRequiredEnvVars() []string {
	return []string{
		"TESSIE_API_KEY",
		"TESSIE_VIN",
	}
}

// Initialize loads configuration
func (w *TeslaWidget) Initialize() error {
	w.apiKey = os.Getenv("TESSIE_API_KEY")
	w.vin = os.Getenv("TESSIE_VIN")
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *TeslaWidget) RegisterRoutes(r chi.Router) {
	r.Get("/tesla", w.getStatus)
}

// getStatus handles GET /api/tesla
func (w *TeslaWidget) getStatus(rw http.ResponseWriter, r *http.Request) {
	if w.apiKey == "" || w.vin == "" {
		http.Error(rw, `{"error":"Tessie API not configured"}`, http.StatusServiceUnavailable)
		return
	}

	url := fmt.Sprintf("https://api.tessie.com/%s/state", w.vin)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(rw, `{"error":"Failed to create request"}`, http.StatusInternalServerError)
		return
	}

	req.Header.Set("Authorization", "Bearer "+w.apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(rw, `{"error":"Failed to fetch Tesla data"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(rw, `{"error":"Failed to read response"}`, http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		http.Error(rw, fmt.Sprintf(`{"error":"Tessie API error: %s"}`, string(body)), resp.StatusCode)
		return
	}

	var tessieData TessieAPIResponse
	if err := json.Unmarshal(body, &tessieData); err != nil {
		http.Error(rw, `{"error":"Failed to parse Tesla data"}`, http.StatusInternalServerError)
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

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(response)
}
