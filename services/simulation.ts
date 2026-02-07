
import { ProbeStatus, Sensors, Gyroscope, Point, Obstacle } from '../types';

export class RubbleRatProbe {
  id: string;
  x: number;
  y: number;
  targetX: number | null = null;
  targetY: number | null = null;
  battery: number = 85 + Math.random() * 15;
  status: ProbeStatus = ProbeStatus.IDLE;
  sensors: Sensors;
  gyro: Gyroscope;
  path: Point[] = [];
  meshNeighbors: string[] = [];
  signalStrength: number = -50;
  heading: number = 0;
  speed: number = 0.5 + Math.random() * 0.5;
  lastPathPointTime: number = 0;
  lowBatteryAlertTriggered: boolean = false;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.sensors = this.generateRandomSensors();
    this.gyro = { pitch: 0, roll: 0, yaw: 0 };
    this.heading = Math.random() * Math.PI * 2;
  }

  generateRandomSensors(): Sensors {
    return {
      ultrasonic: 150 + Math.random() * 50,
      co2: 400 + Math.random() * 50,
      microphone: 30 + Math.random() * 15,
      temperature: 22 + Math.random() * 5,
      thermal: 30 + Math.random() * 5,
      loraSignal: -50 - Math.random() * 20
    };
  }

  update(
    obstacles: Obstacle[], 
    probes: RubbleRatProbe[], 
    base: Point, 
    onDetect: (probe: RubbleRatProbe) => void
  ) {
    if (this.status === ProbeStatus.PAUSED) return;

    // Battery Drain
    this.battery = Math.max(0, this.battery - 0.005);
    
    // Emergency Return logic
    if (this.battery < 15 && !this.lowBatteryAlertTriggered) {
      this.lowBatteryAlertTriggered = true;
      this.status = ProbeStatus.RETRACING;
    }

    // Sensor fluctuations
    this.sensors.co2 += (Math.random() - 0.5) * 10;
    this.sensors.microphone += (Math.random() - 0.5) * 5;
    
    // Random spikes
    if (Math.random() < 0.001) this.sensors.co2 += 400;
    if (Math.random() < 0.001) this.sensors.microphone += 200;

    // Coordinated Alert Check
    if (this.sensors.co2 > 750 && this.sensors.microphone > 100 && this.sensors.thermal > 40) {
      this.status = ProbeStatus.PAUSED;
      onDetect(this);
    }

    // Path Recording
    const now = Date.now();
    if (now - this.lastPathPointTime > 2000) {
      this.path.push({ x: this.x, y: this.y });
      this.lastPathPointTime = now;
      if (this.path.length > 100) this.path.shift();
    }

    // Movement Logic
    if (this.status === ProbeStatus.RETRACING) {
      if (this.path.length > 0) {
        const last = this.path[this.path.length - 1];
        this.targetX = last.x;
        this.targetY = last.y;
        if (this.moveToTarget()) {
          this.path.pop();
        }
      } else {
        this.targetX = base.x;
        this.targetY = base.y;
        if (this.moveToTarget()) this.status = ProbeStatus.IDLE;
      }
    } else if (this.targetX !== null && this.targetY !== null) {
      this.moveToTarget();
    }

    // Collision & Hinderance Avoidance
    this.handleAvoidance(obstacles, probes);

    // Gyro simulation
    this.gyro.pitch = Math.sin(now / 500) * 5;
    this.gyro.roll = Math.cos(now / 700) * 5;
    this.gyro.yaw = (this.heading * 180) / Math.PI;
  }

  private moveToTarget(): boolean {
    if (this.targetX === null || this.targetY === null) return true;
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      if (this.status === ProbeStatus.MOVING) this.status = ProbeStatus.IDLE;
      return true;
    }

    this.heading = Math.atan2(dy, dx);
    this.x += Math.cos(this.heading) * this.speed;
    this.y += Math.sin(this.heading) * this.speed;
    return false;
  }

  private handleAvoidance(obstacles: Obstacle[], probes: RubbleRatProbe[]) {
    // Avoid obstacles
    obstacles.forEach(obs => {
      const dx = this.x - obs.x;
      const dy = this.y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < obs.radius + 15) {
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * 1.5;
        this.y += Math.sin(angle) * 1.5;
        this.sensors.ultrasonic = dist;
      }
    });

    // Avoid other probes
    probes.forEach(p => {
      if (p.id === this.id) return;
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30) {
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * 1;
        this.y += Math.sin(angle) * 1;
      }
    });
  }
}
