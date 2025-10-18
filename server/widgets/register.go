package widgets

// Import all widget packages
import (
	"themancavedashboard/widgets/calendar"
	"themancavedashboard/widgets/ecowitt"
	"themancavedashboard/widgets/meals"
	"themancavedashboard/widgets/personal"
	"themancavedashboard/widgets/photos"
	"themancavedashboard/widgets/tesla"
	"themancavedashboard/widgets/traeger"
	"themancavedashboard/widgets/weather"
)

// RegisterAll registers all widgets
// This is called automatically when the widgets package is imported
func init() {
	// Register each widget here
	Register(&calendar.CalendarWidget{})
	Register(&ecowitt.EcowittWidget{})
	Register(&meals.MealsWidget{})
	Register(&personal.PersonalWidget{})
	Register(&photos.PhotosWidget{})
	Register(&tesla.TeslaWidget{})
	Register(&traeger.TraegerWidget{})
	Register(&weather.WeatherWidget{})
}

// This file serves as the central registration point for all widgets.
// When you create a new widget:
// 1. Import the package above
// 2. Call Register() with your widget instance in init()
