
// const worldSize = localStorage.worldSize;

var init = function(callback) {
    for (let i = 0; i < worldSize; i++) {
        let tempRow = document.createElement('p');
        tempRow.setAttribute('class', 'row');

        let tempId = 'r' + (i + 1)
        tempRow.setAttribute('id', tempId);

        let content = document.getElementById('content');
        content.appendChild(tempRow)
    };

    if (typeof(callback) === 'function') callback;
}


const draw = function() {
    const type = tile => tiles[tile.contains].sprite;

    let rows = document.getElementsByClassName('row');
    for (let i = 0; i < worldSize; i++) {
        let line = [];
        for (let j = 0; j < worldSize; j++) {
            let character = type(world[i][j]);
            line.push(character);
        }
        let row = line.join('')
        // console.log(i, rows[i])
        rows[i].innerHTML = row;
    };
}

window.onload = function() {
    if (world === undefined) {console.log('global vars not synced [world]')};
    // if (localStorage.worldSize === undefined) {console.log('localStorage not synced [worldSize]')};

    init();
    // draw();
}