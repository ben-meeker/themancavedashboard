/**
 * Widget Auto-Discovery
 * This file imports all widget config files to trigger their auto-registration
 */

// Import widget configs to trigger registration
import './Calendar/widget.config';
import './Tesla/widget.config';
import './Weather/widget.config';
import './PlantSensors/widget.config';
import './MealCalendar/widget.config';
import './PhotoCarousel/widget.config';

// Template widget (for reference, commented out by default)
// import './_template/widget.config';

// Export components for backward compatibility
export { default as Calendar } from './Calendar/Calendar';
export { default as Tesla } from './Tesla/Tesla';
export { default as Weather } from './Weather/Weather';
export { default as PlantSensors } from './PlantSensors/PlantSensors';
export { default as MealCalendar } from './MealCalendar/MealCalendar';
export { default as PhotoCarousel } from './PhotoCarousel/PhotoCarousel';
