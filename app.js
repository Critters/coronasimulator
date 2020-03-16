let population = [];

const simSpeed = 5;
const personSize = 15;
const optionsHeight = 40;
const graphHeight = 100;
const labelHeight = 40;

const initialInfection = 1;
const recoverTime = 600;
let socialDistanced = 0;
const simDuration = 2000;

const color_base = 'rgb(214, 214, 214)';
const color_recovered = 'rgb(194, 120, 255)';
const color_recovered_dark = 'rgb(116, 59, 163)';
const color_infected = 'rgb(255, 10, 59)';
const color_infected_dark = 'rgb(189, 4, 41)';

let graph;
let labels;
let options;

let popSize = 100;
let infectedCount = 1;
let recoveredCount = 0;
let simSteps; // Number of steps run

function setup() {
	createCanvas(600, 500);
	graph = new Graph();
	labels = new Labels();
	options = new Options();
	Init();
}

function Init() {
	graph.Init();
	labels.Init();
	options.Init();

	population = [];
	infectedCount = initialInfection;
	recoveredCount = 0;
	simSteps = 0;

	for (let i = 0; i < popSize; i++) {
		population.push(new Person(i < initialInfection, popSize - i < socialDistanced));
	}
}

function draw() {
	if (simSteps >= simDuration) {
		graph.Snapshot();
		Init();
	}

	stroke(1);
	fill(100);
	rect(0, graphHeight + labelHeight + optionsHeight, width, height - graphHeight - labelHeight - optionsHeight);

	population.forEach((person) => {
		person.Tick();
		person.Draw();
	});

	graph.AddPoint();
	labels.Draw();
	options.Draw();

	simSteps += simSpeed;
}

class Options {
	constructor() {
		this.staticSlider = createSlider(0, 100, 0);
		this.staticSlider.position(115, 16);
		this.staticValue = this.staticSlider.value();
		this.staticText = text(this.staticSlider.value(), 245, 18);
	}
	Init() {}
	Draw() {
		stroke(1);
		fill(200);
		rect(0, 0, width, optionsHeight);
		textSize(12);
		stroke(0);
		strokeWeight(0);
		fill(0);
		text('Social Distanced:', 10, 24);
		textSize(30);
		strokeWeight(1);
		fill(color(color_recovered));
		text(socialDistanced, 245, 32);
		if (this.staticSlider.value() != this.staticValue) {
			socialDistanced = this.staticSlider.value();
			this.staticValue = socialDistanced;
			Init();
		}
	}
}

class Labels {
	constructor() {}

	Init() {}

	Draw() {
		stroke(1);
		fill(0);
		rect(0, graphHeight + optionsHeight, width, labelHeight);
		textSize(30);
		fill(color(color_infected));
		text(
			`Infected: ${(100 / population.length * infectedCount).toFixed(0)} %`,
			10,
			graphHeight + optionsHeight + 30
		);
		fill(color(color_recovered));
		text(
			`Recovered: ${(100 / population.length * recoveredCount).toFixed(0)} %`,
			240,
			graphHeight + optionsHeight + 30
		);
	}
}

class Graph {
	constructor() {
		this.step;
		this.infectedData;
		this.recoveredData;
		this.infectedSnapshot = [];
		this.recoveredSnapshot = [];
		this.infectedAverage = [];
		this.recoveredAverage = [];
	}

	Init() {
		this.oldInfected = 0;
		this.oldRecovered = 0;
		this.step = 0;
		this.stepSize = width / simDuration * simSpeed;
		this.infectedData = [];
		this.recoveredData = [];
		this.DrawSnapshot();
	}

	AddPoint() {
		this.infectedData.push(infectedCount);
		this.recoveredData.push(recoveredCount);

		stroke(1);
		fill(200);
		rect(0, optionsHeight, width, graphHeight);

		this.step++;
		rectMode(CORNERS);
		for (let i = 0; i < this.infectedData.length; i++) {
			stroke(color(color_infected));
			fill(color(color_infected));
			rect(
				i * this.stepSize,
				graphHeight + optionsHeight,
				(i + 1) * this.stepSize,
				graphHeight + optionsHeight - this.infectedData[i]
			);

			stroke(color(color_recovered));
			fill(color(color_recovered));
			rect(i * this.stepSize, optionsHeight, (i + 1) * this.stepSize, this.recoveredData[i] + optionsHeight);
		}
		rectMode(CORNER);

		stroke(0);
		stroke(0);
		fill(0, 0, 0, 0);
		rect(0, optionsHeight, width, graphHeight + optionsHeight);
		this.DrawSnapshot();
	}

	Snapshot() {
		this.infectedSnapshot.push(this.infectedData);
		this.recoveredSnapshot.push(this.recoveredData);
		if (this.infectedSnapshot.length > 4) {
			this.infectedSnapshot.splice(0, 1);
			this.recoveredSnapshot.splice(0, 1);
		}
		const L = this.infectedSnapshot.length;
		if (L > 0) {
			this.infectedAverage = [];
			this.recoveredAverage = [];
			for (let i = 0; i < L; i++) {
				for (let n = 0; n < this.infectedSnapshot[i].length; n++) {
					if (i == 0) {
						this.infectedAverage.push(this.infectedSnapshot[i][n] / L);
						this.recoveredAverage.push(this.recoveredSnapshot[i][n] / L);
					} else {
						this.infectedAverage[n] += this.infectedSnapshot[i][n] / L;
						this.recoveredAverage[n] += this.recoveredSnapshot[i][n] / L;
					}
				}
			}
		}
	}

	DrawSnapshot() {
		if (!this.infectedAverage) return;
		stroke(color(color_infected_dark));
		for (let i = 1; i < this.infectedAverage.length; i++) {
			line(
				(i - 1) * this.stepSize,
				graphHeight + optionsHeight - this.infectedAverage[i - 1],
				i * this.stepSize,
				graphHeight + optionsHeight - this.infectedAverage[i]
			);
		}
		stroke(color(color_recovered_dark));
		for (let i = 1; i < this.recoveredAverage.length; i++) {
			line(
				(i - 1) * this.stepSize,
				optionsHeight + this.recoveredAverage[i - 1],
				i * this.stepSize,
				optionsHeight + this.recoveredAverage[i]
			);
		}
	}
}

class Person {
	constructor(_infected, _static) {
		this.position = createVector(
			personSize * 2 + random() * (width - personSize * 2),
			personSize +
				graphHeight +
				optionsHeight +
				labelHeight +
				random() * (height - graphHeight - labelHeight - optionsHeight - personSize * 2)
		);
		this.vector = createVector();
		this.static = _static;
		if (!_static) {
			this.vector = createVector(random() - 0.5, random() - 0.5).normalize().mult(simSpeed);
		}
		this.infected = _infected;
		this.infectedTime = 0;
		this.recovered = false;
	}

	Tick() {
		if (this.position.x < personSize || this.position.x > width - personSize) this.vector.x = -this.vector.x;
		if (
			this.position.y < optionsHeight + graphHeight + labelHeight + personSize ||
			this.position.y > height - personSize
		)
			this.vector.y = -this.vector.y;

		this.position.add(this.vector);
		this.CheckCollision();

		if (this.infected && !this.recovered) {
			this.infectedTime += simSpeed;
			if (this.infectedTime > recoverTime) {
				this.recovered = true;
				recoveredCount++;
				infectedCount--;
			}
		}
	}

	Draw() {
		stroke(1);
		strokeWeight(2);
		fill(color(color_base));
		if (this.infected) fill(color(color_infected));
		if (this.recovered) fill(color(color_recovered));
		ellipse(this.position.x, this.position.y, personSize, personSize);
	}

	CheckCollision() {
		population.forEach((person) => {
			if (person != this) {
				if (this.position.dist(person.position) < personSize) {
					// Bounce off each other
					let distanceVect = person.position.copy().sub(this.position);
					let distanceMag = distanceVect.mag();
					let distanceCorrection = (personSize - distanceMag) / 2;
					let correctionVect = distanceVect.normalize().mult(distanceCorrection);
					if (!person.static) {
						person.vector.add(correctionVect);
						person.vector.normalize().mult(simSpeed);
					}
					if (!this.static) {
						this.vector.sub(correctionVect);
						this.vector.normalize().mult(simSpeed);
					}

					// Infect other (if I am infected)
					if (
						(this.infected && !this.recovered && !person.infected) ||
						(person.infected && !person.recovered && !this.infected)
					) {
						person.infected = true;
						this.infected = true;
						infectedCount++;
					}
				}
			}
		});
	}
}
