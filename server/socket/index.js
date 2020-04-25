const models = require('../models');

function makeErrorResponse(message) {
    return {
        success: false, message
    }
}

function makeSuccessResponse(data, message = '') {
    return {
        success: true, message: message || 'OKE', data: data
    }
}


function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function findColor(color) {
    const {r, g, b} = hexToRgb(color);
    const R = r < 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const G = g < 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const B = b < 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    return L <= 0.1833 ? '#f0f0f0' : L >= 0.175 ? '#101010' : '#f0f0f0';
}

function randomColor() {
    return '#'+'0123456789abcdef'.split('').map(function(v,i,a){
        return i>5 ? null : a[Math.floor(Math.random()*16)] }).join('');
}

function socketHandler(socket) {
    console.log("Socket connected: ", socket.id);
    const self = this;

    socket.on('new user', async function (name, cb) {
        const newUser = await models.User.create({
            name
        });
        socket.user_id = newUser._id.toString();
        return cb(makeSuccessResponse({id: newUser._id.toString(), name: newUser.name}));
    });

    socket.on('set id', async function (id, cb) {
        const user = await models.User.findById(id);
        if (!user) return cb(makeErrorResponse(cb));
        socket.user_id = id;
        return cb(makeSuccessResponse())
    });

    socket.on('new game', async function (range, cb) {
        if (!socket.user_id) return cb(makeErrorResponse('toang is real'));
        const user = await models.User.findById(socket.user_id);
        const newGame = await models.Game.create({
            range: +range,
            players: [
                {id: socket.user_id, name: user.name, selected: []}
            ],
            current_number: 0
        });
        socket.join(newGame._id.toString());
        return cb(makeSuccessResponse({
            id: newGame.id,
            range: newGame.range,
            currentNumber: newGame.current_number,
            players: newGame.players
        }));

    });

    socket.on('join game', async function (game_id, cb) {
        if (!socket.user_id) return cb(makeErrorResponse('toang is real'));
        const user = await models.User.findById(socket.user_id);
        const existGame = await models.Game.findById(game_id);
        if (!existGame) return cb(makeErrorResponse('Game này dell tồn tại'));
        socket.join(game_id);
        if (!existGame.players.find(u => u.id === socket.user_id)) {
            existGame.players.push({id: socket.user_id, name: user.name, selected: []});
        }
        self.in(game_id).emit('user join room', JSON.stringify({game_id, players: existGame.players}));
        await existGame.save();
        return cb(makeSuccessResponse({
            id: existGame.id,
            range: existGame.range,
            currentNumber: existGame.current_number,
            players: existGame.players
        }));
    });

    socket.on('quit game', async function (game_id) {
        if (!socket.user_id || !game_id) return;
        socket.leave(game_id);
        self.in(game_id).emit('user leave room', JSON.stringify({game_id, user_id: socket.user_id}));

    });

    socket.on('fetch game data', async function (game_id, cb) {
        if (!socket.user_id) return cb(makeErrorResponse('Chưa login fetch game cc'));
        const game = await models.Game.findById(game_id);
        if (!game) return cb(makeErrorResponse('Game dell tồn tại!'));
        if (!game.players.find(p => p.id === socket.user_id)) return cb(makeErrorResponse('Mày đã làm gì vào phòng này'));
        socket.join(game_id);
        return cb(makeSuccessResponse(game));
    });

    socket.on('select number', async function (data, cb) {
        if (!socket.user_id) return cb(makeErrorResponse('Chưa login fetch game cc'));
        const {game_id, number} = data;
        const game = await models.Game.findById(game_id);
        if (!game) return cb(makeErrorResponse('Game dell tồn tại!'));
        if (!game.players.find(p => p.id === socket.user_id)) return cb(makeErrorResponse('Mày đã làm gì vào phòng này'));
        if (game.current_number >= game.range) return cb(makeErrorResponse('Hết game rồi! Chơi game mới đê'));
        if ((game.current_number + 1) !== +number) return cb(makeErrorResponse(`Phải chọn ${(game.current_number + 1)} chứ, đừng có mà ăn gian 😡!`));
        game.current_number = game.current_number + 1;
        const updatePlayer = game.players.find(u => u.id === socket.user_id);
        updatePlayer.selected.push(+number);
        self.in(game_id).emit('selected number', JSON.stringify({game_id, number, user_id: socket.user_id}));
        console.log(`sendToChannel | broadcasting selected number in channel ${game_id} include sender`);
        await game.save();
        return cb(makeSuccessResponse());
    });

    socket.on('disconnect', function () {
        console.log('Socket disconnected: ', socket.id, socket.user_id);
    });
}

module.exports = {
    socketHandler
};
