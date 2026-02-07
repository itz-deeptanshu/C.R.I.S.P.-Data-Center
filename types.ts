
export enum ProbeStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  MOVING = 'MOVING',
  ALERT = 'ALERT',
  RETURNING = 'RETURNING',
  RETRACING = 'RETRACING',
  PAUSED = 'PAUSED'
}

export interface Sensors {
  ultrasonic: number;
  co2: number;
  microphone: number;
  temperature: number;
  thermal: number;
  loraSignal: number;
}

export interface Gyroscope {
  pitch: number;
  roll: number;
  yaw: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'rubble' | 'wall';
}

export enum FormationType {
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  LINE = 'LINE',
  WEDGE = 'WEDGE'
}
