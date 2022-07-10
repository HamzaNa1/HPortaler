import type Canvas from "../components/Canvas.svelte";
import type Sidebar from "../components/Sidebar.svelte";
import type SidebarInfo from "./sidebar";

import { World } from "./world";
import type { Ball, Connection } from "./world";
import type { ZoneInfo } from "./zones";
import ZonesGenerator from "./zones";

import { isLoggedIn, screenSize, scaleSetting } from "./stores";

export default class MainLoop {
  container: any;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  sidebar: Sidebar;

  isLoggedIn: boolean;

  world: World;
  selectedBall: Ball;

  mouse: Mouse;

  homeImage: HTMLImageElement;
  blackzoneHomeImage: HTMLImageElement;

  scale: number;

  constructor(canvas: Canvas, sidebar: Sidebar) {
    this.container = canvas.getContainer();
    this.canvas = canvas.getCanvas();
    this.ctx = this.canvas.getContext("2d");

    this.sidebar = sidebar;
    sidebar.SetMainLoop(this);

    isLoggedIn.subscribe((value) => {
      this.isLoggedIn = value;
    });

    this.world = new World();
    this.selectedBall = null;

    this.scale = 1;
    scaleSetting.subscribe((value) => {
      this.scale = value;
    });

    this.mouse = {
      x: 0,
      y: 0,
      buttons: [false, false],
    };

    window.addEventListener("resize", () => this.onResize());
    this.onResize();

    this.container.addEventListener("mousedown", (e: MouseEvent) => {
      this.onMouseDown(e);
    });
    this.container.addEventListener("mouseup", (e: MouseEvent) => {
      this.onMouseUp(e);
    });
    this.container.addEventListener("mousemove", (e: MouseEvent) => {
      this.onMouseMove(e);
    });

    this.homeImage = new Image(40, 40);
    this.homeImage.src = "/home.png";
    this.homeImage.width = 40;
    this.homeImage.height = 40;

    this.blackzoneHomeImage = new Image(40, 40);
    this.blackzoneHomeImage.src = "/blackzoneHome.png";
    this.blackzoneHomeImage.width = 40;
    this.blackzoneHomeImage.height = 40;

    this.clear();
    window.requestAnimationFrame(() => this.gameLoop(this));
  }

  changeScale(newScale: number) {
    if (newScale <= 0) {
      return;
    }

    this.scale = newScale;

    this.homeImage.width = 40 * this.scale;
    this.homeImage.height = 40 * this.scale;
    this.blackzoneHomeImage.width = 40 * this.scale;
    this.blackzoneHomeImage.height = 40 * this.scale;
  }

  addConnection(info: SidebarInfo) {
    if (info.from == "" || info.to == "") {
      return;
    }

    if (info.type == "royal") {
      info.h = 24;
      info.m = 0;
    }

    let from = ZonesGenerator.GetZone(info.from);
    let to = ZonesGenerator.GetZone(info.to);

    if (from == null || to == null) {
      return;
    }
    const date = new Date();
    let endTime = (info.h * 60 + info.m) * 60000 + date.getTime();

    this.world.AddConnection(from, to, info.type, endTime);
  }

  deleteSelected() {
    if (this.selectedBall == null) {
      return;
    }

    this.world.DeleteBall(this.selectedBall);
  }

  randomizePositions() {
    this.world.SortAll();
  }

  onMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      this.mouse.buttons[0] = true;
      this.selectedBall = this.world.GetBallAt(this.mouse.x, this.mouse.y);
      if (this.selectedBall != null) {
        this.sidebar.SetFrom(this.selectedBall.zone.name);
      }
    } else if (e.button === 2) {
      this.mouse.buttons[1] = true;
    }
  }

  onMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.mouse.buttons[0] = false;
    } else if (e.button === 2) {
      this.mouse.buttons[1] = false;
    }
  }

  onMouseMove(e: MouseEvent) {
    this.mouse.x = e.clientX - 220 - this.canvas.width / 2;
    this.mouse.y = e.clientY - this.canvas.height / 2;
  }

  onResize() {
    if (!this.container || !this.canvas) return;

    this.container.width = window.innerWidth;
    this.container.height = window.innerHeight;
    this.canvas.width = window.innerWidth - 220;
    this.canvas.height = window.innerHeight;
    screenSize.set({ x: this.canvas.width, y: this.canvas.height });
  }

  gameLoop(self: MainLoop) {
    window.requestAnimationFrame(() => self.gameLoop(self));

    if (!this.isLoggedIn) {
      return;
    }

    this.update();
    this.draw();
  }

  update() {
    if (this.selectedBall && this.mouse.buttons[0]) {
      this.selectedBall.x = this.mouse.x;
      this.selectedBall.y = this.mouse.y;
    }

    this.world.CheckConnections();
  }

  draw() {
    this.clear();

    this.world.connections.forEach((connection) => {
      this.drawConnection(connection);
    });

    this.world.balls.forEach((ball) => {
      this.drawBall(ball);
    });
  }

  intersect() {
    let c1 = this.world.connections[0];
    let c2 = this.world.connections[1];

    alert(this.world.Intersect(c1, c2));
  }

  clear() {
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgb(60, 43, 61)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawConnection(connection: Connection) {
    let x1 = connection.start.x + this.canvas.width / 2;
    let y1 = connection.start.y + this.canvas.height / 2;
    let x2 = connection.end.x + this.canvas.width / 2;
    let y2 = connection.end.y + this.canvas.height / 2;

    this.drawLine(x1, y1, x2, y2, this.connectionToColor(connection));

    if (connection.type != "royal") {
      this.drawText(
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        this.getTimeLeft(connection),
        "white"
      );
    }
  }

  drawBall(ball: Ball) {
    let x = ball.x + this.canvas.width / 2;
    let y = ball.y + this.canvas.height / 2;

    if (ball.zone.name == "Setent-Qintis") {
      this.drawImage(x, y, this.homeImage);
    } else if (ball.zone.name == "Everwinter Expanse") {
      this.drawImage(x, y, this.blackzoneHomeImage);
    } else {
      this.drawCircleFill(
        x,
        y,
        ball.radius * this.scale,
        this.zoneToColor(ball.zone)
      );
      this.drawText(x, y, ball.zone.tier, "white");
    }

    if (ball == this.selectedBall) {
      this.drawCircle(x, y, ball.radius * this.scale, 1.25, "white");
    } else {
      this.drawCircle(x, y, ball.radius * this.scale, 0.33, "black");
    }

    this.drawText(x, y + ball.radius * this.scale * 2, ball.zone.name, "white");
  }

  drawCircleFill(x: number, y: number, radius: number, color: string) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawCircle(
    x: number,
    y: number,
    radius: number,
    lineWidth: number,
    color: string
  ) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: string) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  drawText(x: number, y: number, text: string, color: string) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = color;
    let fontSize = 12 * this.scale;
    this.ctx.font = "bold " + fontSize + "px Arial";
    let metrics = this.ctx.measureText(text);
    x -= metrics.width / 2;
    y +=
      (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2;

    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);
  }

  drawImage(x: number, y: number, image: CanvasImageSource) {
    this.ctx.beginPath();
    this.ctx.drawImage(
      image,
      x - 20 * this.scale,
      y - 20 * this.scale,
      40 * this.scale,
      40 * this.scale
    );
  }

  connectionToColor(connection: Connection): string {
    switch (connection.type) {
      case "green":
        return "rgb(0, 128, 0)";
      case "blue":
        return "rgb(0, 0, 255)";
      case "gold":
        return "rgb(214, 157, 0)";
      case "royal":
        return "black";
      default:
        return "";
    }
  }

  zoneToColor(zone: ZoneInfo): string {
    switch (zone.color) {
      case "blue":
      case "city":
        return "rgb(100, 149, 237)";
      case "red":
        return "rgb(219, 112, 147)";
      case "yellow":
        return "rgb(218, 165, 32)";
      case "black":
        return "black";
      case "road":
        return "rgb(64, 224, 208)";
      case "road-ho":
        return "rgb(102, 51, 153)";
      default:
        return "";
    }
  }

  getTimeLeft(connection: Connection): string {
    const date = new Date();
    let time = connection.endTime - date.getTime() + 60000;

    let hours = time / 3600000;
    let mintues = (hours - Math.floor(hours)) * 60;

    return Math.floor(hours) + "h " + Math.floor(mintues) + "m";
  }
}

interface Mouse {
  x: number;
  y: number;
  buttons: boolean[];
}
