/*
NOTES
- currently multiple blobs can occupy the same tile. change in populate() func.
*/
//world properties
const worldSize = 10;

const dayLength = 10;
const startingPopulation = 10; //must be < (4*worldSize - 4)
const foodAmount = 10; //must be < (worldSize-2)^2
const childVariation = 0.1; //10%
const defaults = {
    speed: 1,
    sense: 2,
    persistence: 8
}
const tickLength = 1000; //milliseconds

const tiles = {
    nothing: {
        sprite: '.'
    },
    blob: {
        sprite: '@'
    },
    food: {
        sprite: 'x'
    }
}

let tribe = []; //array of all blobs
let world;

let day = 0,
    time = 0;

const Blob = function() {
    this.speed = defaults.speed;
    this.sense = defaults.sense;
    this.spawnChild = function(){
        // +/- % of properties
    }
    this.pos = {
        x: undefined, //(initial position function)
        y: undefined //(initial position function)
    }
    this.vel = {
        x: 0,
        y: 0
    }
    /*how far out the blob will search. limited by sense.
      sense gives the maximum range, persistence is how much 
      of this range the creature bothers to search.
    */
    this.persistence = defaults.persistence; 
    this.foodEaten = 0; //
    this.search = function() {
        // console.log("searching for food")

        //intended direction
        let dirX = 0, 
            dirY = 0;
        let future = {};
        let attempts = 0; //depreciated
        let prospects = [];
        let searchIndex = 1;

        do {//loop through each single one in eigths
            if (searchIndex > this.persistence) {return false};
            /*
            OEIS #A002262: 	0, 0, 1, 0, 1, 2, 0, 1, 2, 3
            x(n) gives row of Nth digit in a triangle
            0 \ _
            1 | 2 \ _
            3 | 4 | 5 \ _
            6 | 7 | 8 | 9 \
            */
            /*
            OEIS #A003056: 	0, 1, 1, 2, 2, 2, 3, 3, 3, 3
            y(n) gives col of Nth digit in a triangle
            0 \ _
            1 | 2 \ _
            3 | 4 | 5 \ _
            6 | 7 | 8 | 9 \
            */

            // const trinv = x => Math.floor( ( 1 + Math.sqrt( 1 + 8 * x ) )/ 2 );
            // const x = n => n - ( trinv(n) * (trinv(n) - 1) ) / 2;
            // since trinv(x) = y(x)+1
            const y = n => Math.floor( ( Math.sqrt( 1 + 8 * n ) -1 ) / 2 );
            const x = n => n - ( y(n) * (y(n) + 1) ) / 2;

            dirX = x(searchIndex);
            dirY = y(searchIndex);

            for (let i = 0; i < 8; i++) { //mirror to other 7 eigths
                /* Instead of 3 nested for loops, use 0,1,..,7 in binary with switch on bits
                   bit 0: switch sgn(x)
                   bit 1: switch sgn(y)
                   bit 2: switch (x,y)
                */
                let rot = [dirX, dirY]; //current rotation
                
                //returns 1 (true) if bit 0 = 1;
                if (i >>> 2) rot[0] *= -1;

                //returns 1 (true) if bit 1 = 1;
                if ( i>>>1 & 1) rot[1] *= -1;

                //returns 1 (true) if bit 0 = 1;
                if (i & 1) rot.reverse();
                
                future.x = this.pos.x + rot[0];
                future.y = this.pos.y + rot[1];

                let intended = {
                    x: rot[0],
                    y: rot[1]
                }
                
                if (world[future.y] !== undefined &&
                    world[future.y][future.x] !== undefined &&
                    world[future.y][future.x].contains === "food" ) {
                    prospects.push(intended)
                }

            }
            //increment
            searchIndex++;
        } while (
                Math.hypot(dirX, dirY) < this.sense &&
                true //other future checks
        );
        if (prospects.length === 0) {//no matches found

            let magnitude = this.sense;

            do {
            //choose random location
            let angle = Math.random() * 2 * Math.PI;
            dirX = magnitude * Math.cos(angle);
            dirY = magnitude * Math.sin(angle);

            dirX = intBlur(dirX, 1)
            dirY = intBlur(dirY, 1)

            future.x = this.pos.x + Math.floor(dirX);
            future.y = this.pos.y + Math.floor(dirY);

            } while (
                world[future.y] === undefined ||
                world[future.y][future.x] === undefined ||
                world[future.y][future.x].contains !== "nothing"
            )
        } else { //potential matches

            //find smallest hypotenuse in pospects
            let closest = Infinity; //ensure bigger than any match;
            for (let i = 0; i < prospects.length; i++) {
                let prospect = prospects[i];
                let distance = Math.hypot(prospect.x, prospect.y);
                
                if (distance < closest) {
                    closest = distance;
                    dirX = prospect.x;
                    dirY = prospect.y;
                }
            }

        }

        /* OLD
        //future thing to check : can you += objects?
        this.vel = {
            x: dirX,
            y: dirY
        }

        //mark tile as taken
        world[future.y][future.x].contains = "markedLocation";
        // console.log("marked location")
        */
        

        /*
            IF hypot(vel.x, vel.y) > this.speed:
                get angle of the velocity vector (A)
                round magnitude of velocity to this.speed (vMax)
                vel.x = vMax * cosA, vel.y = vMax * sinA
                Math.floor() vel.x and vel.y
        */
        if ( Math.hypot(dirX, dirY) > this.speed) {
            let angle = Math.atan2(dirY, dirX);
            let adjustedMagnitude = this.speed;
            let adjustedVel = {
                x: adjustedMagnitude * Math.cos(angle) ,
                y: adjustedMagnitude * Math.sin(angle)
            }
            dirX = adjustedVel.x;
            dirY = adjustedVel.y;
        }
        
        return {
            x: Math.floor(dirX),
            y: Math.floor(dirY)
        }
    }
    this.move = function() {
        this.vel = this.search();

        //clear marked location
        world[this.pos.y][this.pos.x].contains = "nothing";

        //update position
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        /*
        if cell contains food, eat it
        */

        world[this.pos.y][this.pos.x].contains = "blob";
        
        //reset velocity
        this.vel.x = 0;
        this.vel.y = 0;

    }
};

//generate random numbers with a bell-curve type distribution around 0.5
const gaussianRandom = function() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

//vary an integer by an average percentage of +/-{meanVariation}
const intBlur = function(int, meanVariation) {
    const scaledVar = 2 * gaussianRandom() * meanVariation;
    const randSign = Math.random() < 0.5 ? -1 : 1;
    const variation = int * scaledVar * randSign;
    return int + variation;
    
}

const distance = function(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

const populate = function() {
    //create all blobs and add them to the tribe
    for (let i = 0; i < startingPopulation; i++) {
        const baby = new Blob();
        // define all properties
        baby.speed = intBlur(defaults.speed, childVariation);

        //define a random outer location
        let pos = [];
        do { 
            pos = [
                    Math.random() < 0.5 ? 0 : worldSize - 1, //pick a side on first edge
                    Math.floor(Math.random() * worldSize) //integer location on second edge
                ];
            Math.random() < 0.5 ? pos.reverse() : null; //randomise orientation
        } while ( world[pos[1]][pos[0]].contains !== "nothing" );
        baby.pos.x = pos[0];
        baby.pos.y = pos[1];

        world[baby.pos.y][baby.pos.x].contains = "blob";

        tribe.push(baby);
        // console.log('Creating blob ' + tribe.length + '/' + startingPopulation)
    }
    // console.log("> Finished creating blobs")
}

const grow = function() {
    for (let i = 0; i < foodAmount; i++) {
        //if the selected tile is populated, generate another random tile.
        //if no tiles are available will generate an infinite loop. oh well.
        do { 
            randX = Math.ceil( Math.random() * (worldSize - 2) );
            randY = Math.ceil( Math.random() * (worldSize - 2) );
        } while ( world[randY][randX].contains !== "nothing" );
        world[randY][randX].contains = "food";

        // console.log('Spawned food ' + (i + 1) + '/' + foodAmount)
    }
    // console.log("> Finished spawning food")
}

const riseAndShine = function(){
    day++ //incrememnt day counter
    time = 0;
    //Spawn all blobs
    for (let i = 0; i < tribe.length; i++) {
        let x = tribe[i].pos.x,
            y = tribe[i].pos.y;
        world[y][x].contains = "blob";
    };
    //grow the day's food
    grow();
};

const timeFlow = function() {
    if (time < dayLength) {

        //move each blob in the direction of their food.
        for (let i = 0; i < tribe.length; i++) {
            tribe[i].move()
        };

        time++ //incremement time of day
    } else {
        endOfDay()
    }
}

const endOfDay = function(){
    //reset positions
    //kill hungry blobs
    //spawn children of fit blobs
};

const initWorld = function() {
    world = Array(worldSize);
    for (let i = 0; i < worldSize; i++){
        world[i] = Array(worldSize);
        for (let j = 0; j < worldSize; j++) {
            world[i][j] = {
                pos: {
                    x: j,
                    y: i
                }
            };
            world[i][j].contains = "nothing";
        }
    }
    console.log(`> Initialised world. Size ${worldSize} x ${worldSize}.`)
}

const display = function() {
    const type = tile => tiles[tile.contains].sprite;

    //console.log((world.map(x=>x.map(y=>type(y)).join('')).join("\n")))
    let printWorld = [];
    for (let i = 0; i < worldSize; i++){
        let line = [];
        for (let j = 0; j < worldSize; j++) {
            let character = type(world[i][j]);
            line.push(character);
        }
        line.unshift("║"); //left border
        line.push("║"); //right border
        printWorld.push(line.join(' '));
    };
    printWorld.unshift("╔" + Array(worldSize + 1).fill("═").join('═') + "╗"); //top border
    printWorld.push("╚" + Array(worldSize + 1).fill("═").join('═') + "╝"); //bottom border
    console.log(`# Day: ${day}, Time: ${time}\n` + printWorld.join("\n"))

}


const main = function() {
    initWorld();

    populate();
    riseAndShine();
    // display();
    // draw();

    let tickTock = setInterval( function() {
        timeFlow();
        console.log(`# Day: ${day}, Time: ${time}\n`)
        draw();

        },
        tickLength
    )
}

main();

/*issues
- they can eat each other
- if they are right next to food they get stuck
*/
