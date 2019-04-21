const chalk = require('chalk');

function Hotel({ floorCount, mcCount, scCount }) {
  this.hotel = [];
  for (let i = 0; i < floorCount; i++) {
    this.hotel.push(
      new Floor({
        floorNumber: i + 1,
        mcCount,
        scCount
      })
    )
  }
}

function Floor({ floorNumber, mcCount, scCount }) {
  this.floorNumber = floorNumber;
  this.maxPowerLimit = mcCount * 15 + scCount * 10;
  this.mc = [];
  this.sc = [];
  for (let i = 0; i < mcCount; i++) {
    this.mc.push(
      new Corridor({
        type: "main",
        id: `F-${floorNumber}:MC-${i + 1}`,
        light: "ON",
        ac: "ON"
      })
    )
  }
  for (let i = 0; i < scCount; i++) {
    this.sc.push(
      new Corridor({
        type: "sub",
        id: `F-${floorNumber}:SC-${i + 1}`,
        light: "OFF",
        ac: "ON"
      })
    )
  }
}

function Corridor({ type, id, light, ac }) {
  this.type = type;
  this.id = id;
  this.light = light;
  this.ac = ac;
  this.turnOnLight = () => {
    this.light = "ON";
  }
  this.turnOffLight = () => {
    this.light = "OFF";
  }
  this.turnOnAC = () => {
    this.ac = "ON";
  }
  this.turnOffAC = () => {
    this.ac = "OFF";
  }
}

const eventCreator = (corridor, movement) => {
  return {
    corridor,
    movement
  }
}

const controller = (hotel, event) => {

  let [floor, corridor] = event.corridor.split(":");

  let floorNumber = floor.split("-")[1];

  let selectedFloor = hotel.hotel[floorNumber - 1];

  let selectedCorridor = selectedFloor.sc.filter(c => {
    return c.id === event.corridor;
  })

  if (event.movement) {
    selectedCorridor[0].turnOnLight();
  } else {
    selectedCorridor[0].turnOffLight();
  }

  let powerUsage = floorPowerUsage(selectedFloor);
  const { maxPowerLimit } = selectedFloor;
  let delta = powerUsage - maxPowerLimit;

  let availableCorridorsToOff = getAvailableCorridorsToOff(selectedFloor, selectedCorridor);

  while (delta > 0 && availableCorridorsToOff.length > 0) {

    availableCorridorsToOff[0].turnOffAC();

    powerUsage = floorPowerUsage(selectedFloor);
    delta = powerUsage - maxPowerLimit;
    availableCorridorsToOff = getAvailableCorridorsToOff(selectedFloor, selectedCorridor);
  }

  let availableCorridorsToOn = getAvailableCorridorsToOn(selectedFloor, selectedCorridor);

  while (delta <= -10 && availableCorridorsToOn.length > 0) {

    availableCorridorsToOn[0].turnOnAC();

    powerUsage = floorPowerUsage(selectedFloor);
    delta = powerUsage - maxPowerLimit;
    availableCorridorsToOn = getAvailableCorridorsToOn(selectedFloor, selectedCorridor);
  }

  outputToConsole({
    event,
    floorNumber,
    powerUsage,
    maxPowerLimit,
    delta,
    hotel
  })
}

const floorPowerUsage = (floor) => {
  let corridors = [...floor.mc, ...floor.sc];
  return corridors.reduce((acc, corridor) => {
    return (
      acc +
      (corridor.light === "ON" ? 5 : 0) +
      (corridor.ac === "ON" ? 10 : 0)
    )
  }, 0);
}

const getAvailableCorridorsToOff = (floor, selectedCorridor) => {
  return floor.sc.filter(c => {
    return (
      c !== selectedCorridor &&
      c.ac === "ON"
    )
  })
}

const getAvailableCorridorsToOn = (floor, selectedCorridor) => {
  return floor.sc.filter(c => {
    return (
      c !== selectedCorridor &&
      c.ac === "OFF"
    )
  })
}

const outputToConsole = ({
  event,
  floorNumber,
  powerUsage,
  maxPowerLimit,
  delta,
  hotel
}) => {
  console.log(chalk.blue('==================================================='));

  console.log(chalk.red('event is :'));
  console.table(event);

  console.log(chalk.red('Floor Number is: ', floorNumber));
  
  console.log(chalk.red('main corridors are: '));
  console.table(hotel.hotel[floorNumber - 1].mc, ["type", "id", "light", "ac"]);
  
  console.log(chalk.red('sub corridors are: '));
  console.table(hotel.hotel[floorNumber - 1].sc, ["type", "id", "light", "ac"]);

  console.log(chalk.red('powerUsage is : ', powerUsage));
  console.log(chalk.red('max power limit is : ', maxPowerLimit));
  console.log(chalk.red('delta is : ', delta));
}

const outputHotelToConsole = (hotel) => {
  let numberOfFloor = hotel.length;
  for (let i = 0; i < numberOfFloor; i++) {
    let floorNumber = i + 1;

    console.log(chalk.blue('==================================================='));
    console.log(chalk.red('Floor Number is: ', floorNumber));

    console.log(chalk.red('main corridors are: '));
    console.table(hotel[floorNumber - 1].mc, ["type", "id", "light", "ac"]);

    console.log(chalk.red('sub corridors are: '));
    console.table(hotel[floorNumber - 1].sc, ["type", "id", "light", "ac"]);
  }
}

const executor = ({floorCount, mcCount, scCount, events}) => {
  let aHotel = new Hotel({ floorCount, mcCount, scCount });

  console.log(chalk.blue('==================================================='));
  console.log(chalk.red('default hotel state is: '));
  outputHotelToConsole(aHotel.hotel);

  console.log(chalk.blue('==================================================='));
  console.log(chalk.red('applying the sensor events:'));

  for (let event of events) {
    controller(aHotel, eventCreator(event[0], event[1]));
  }

  console.log(chalk.blue('==================================================='));
  console.log(chalk.red('final hotel state is: '));
  outputHotelToConsole(aHotel.hotel);

};

//=======================inputs========================================

const input1 = {
  floorCount: 2,
  mcCount: 1,
  scCount: 2,
  events: [
    ["F-1:SC-2", true],
    ["F-1:SC-2", false]
  ]
}

const input2 = {
  floorCount: 2,
  mcCount: 2,
  scCount: 3,
  events: [
    ["F-2:SC-1", true],
    ["F-2:SC-2", true],
    ["F-2:SC-3", true]
  ]
}

const input3 = {
  floorCount: 2,
  mcCount: 2,
  scCount: 3,
  events: [
    ["F-1:SC-2", true],
    ["F-1:SC-1", true],
    ["F-1:SC-2", false],
    ["F-2:SC-1", true],
    ["F-2:SC-3", true],
    ["F-2:SC-2", true],
    ["F-2:SC-1", false],
    ["F-1:SC-1", false]
  ]
}

executor(input1);
