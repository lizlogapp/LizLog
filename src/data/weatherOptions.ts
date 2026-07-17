import { ImageSourcePropType } from 'react-native';

export type WeatherOption = {
  key: string;
  label: string;
  source: ImageSourcePropType;
};

export const WEATHER_OPTIONS: WeatherOption[] = [
  { key: 'weather-sunny', label: '晴天', source: require('../../assets/icons/weather-sunny.png') },
  { key: 'weather-partly-cloudy', label: '多雲時晴', source: require('../../assets/icons/weather-partly-cloudy.png') },
  { key: 'weather-cloudy', label: '陰天', source: require('../../assets/icons/weather-cloudy.png') },
  { key: 'weather-rain', label: '下雨', source: require('../../assets/icons/weather-rain.png') },
  { key: 'weather-thunder', label: '雷雨', source: require('../../assets/icons/weather-thunder.png') },
  { key: 'weather-wind', label: '有風', source: require('../../assets/icons/weather-wind.png') },
  { key: 'weather-snow', label: '下雪', source: require('../../assets/icons/weather-snow.png') },
  { key: 'weather-moon', label: '夜晚', source: require('../../assets/icons/weather-moon.png') },
];

export function getWeatherOption(key?: string): WeatherOption {
  return WEATHER_OPTIONS.find(option => option.key === key) || WEATHER_OPTIONS[0];
}
