import React, {Component} from 'react';
import './App.scss'
import socketIOClient from "socket.io-client";
const socket = socketIOClient('http://number.signals.vn');

function Square(props) {
    return (
        <button className={props.class} key={props.number} onClick={props.onClick}>
            {props.number}
        </button>
    );
}

function UserScore(props) {
    return (
        <li key={props.id}>
            <strong>{props.name}</strong> - {props.score}
        </li>
    );
}

class Board extends Component {

    constructor(props) {
        super(props);
        this.state = {
            squares: [],
            xIsNext: true,
            game_ended: false,
            cols: 0,
            gameStyle: null,
            user: null,
            range: 100,
            currentNumber: 0,
            game_id: null,
            players: []
        };
        this.inputText = React.createRef();
        this.inputNumber = React.createRef();
        this.inputGameId = React.createRef();

        this.renderSquare = this.renderSquare.bind(this);
        this.renderBoard = this.renderBoard.bind(this);
        this.renderUserScore = this.renderUserScore.bind(this);
        this.newGame = this.newGame.bind(this);
        this.joinGame = this.joinGame.bind(this);
        this.onNewUser = this.onNewUser.bind(this);
        this.checkGameEnded = this.checkGameEnded.bind(this);

        this.onReconnect = this.onReconnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.connectServer = this.connectServer.bind(this);
        this.subscribeManager = this.subscribeManager.bind(this);
        this.removeListeners = this.removeListeners.bind(this);
        this.onSelectedNumber = this.onSelectedNumber.bind(this);
        this.userJoinRoom = this.userJoinRoom.bind(this);
        this.userLeaveRoom = this.userLeaveRoom.bind(this);

    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState(() => {
            const cols = Math.floor(nextProps.width / 45);
            const gameStyle = {
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
            };
            return {
                cols,
                gameStyle
            }
        });
    }

    componentDidMount() {
        this.subscribeManager(
            ["reconnect", "disconnect"],
            [this.onReconnect, this.onDisconnect]
        );
        this.connectServer();
    }

    //SOCKET START
    subscribeManager(events, callbacks) {
        events.map((event, idx) => socket.on(`${event}`, callbacks[idx]));
    }

    async connectServer() {
        const userData = localStorage.getItem('find_number_user');
        const game_id = localStorage.getItem('game_id');
        const self = this;
        this.subscribeManager(
            [
                'selected number',
                'user join room',
                'user leave room'
            ],
            [
                this.onSelectedNumber,
                this.userJoinRoom,
                this.userLeaveRoom,
            ]);
        if (userData) {
            const user = JSON.parse(userData);
            this.setState({
                user
            });
            socket.emit('set id', user.id, function (res) {
                if (!res.success) return;
                if (game_id) {
                    socket.emit('fetch game data', game_id, function (res) {
                        if (res.success) {
                            const selectedNumber = window._.flatten(res.data.players.map(x => x.selected));
                            const squares = window._.shuffle(new Array(+res.data.range).fill(null).map((e, i) => {
                                const number = i + 1;
                                const className = selectedNumber.includes(number) ? 'square selected': 'square';
                                return {
                                    number: i + 1,
                                    class: className,
                                    selected: false
                                }
                            }));
                            self.setState({
                                game_id: game_id,
                                players: res.data.players,
                                currentNumber: res.data.current_number,
                                range: +res.data.range,
                                squares
                            });
                            setImmediate(() => self.checkGameEnded());
                        }
                    })
                }
            });
        }
    }

    userJoinRoom(data) {
        const {players, game_id} = JSON.parse(data);
        if (game_id !== this.state.game_id) return;
        this.setState({players});
    }

    userLeaveRoom(data) {
        const {user_id, game_id} = JSON.parse(data);
        if (game_id !== this.state.game_id) return;
        const leaveUser = this.state.players.find(u => u.id === user_id);
        if (user_id === this.state.user.id) {
            window.alert(`Liu liu, sợ quá bỏ chạy kìa 🤣🤣🤣`)
        } else {
            window.alert(`${leaveUser && leaveUser.name || 'ai đó'} đã bỏ chạy.`)
        }
    }

    onSelectedNumber(data) {
        const {game_id, user_id, number} = JSON.parse(data);
        if (game_id !== this.state.game_id) return;
        const players = this.state.players.slice();
        const setColorPlayer = players.find(x => x.id === user_id);
        setColorPlayer.selected.push(+number);

        const squares = this.state.squares.slice();
        const index = squares.findIndex(x => x.number === +number);
        squares[index] = Object.assign(squares[index], {
            selected: true,
            class: 'square selected'
        });

        this.setState({
            players,
            squares,
            currentNumber: +number
        });

        setImmediate(() => this.checkGameEnded())
    }

    checkGameEnded() {
        if (+this.state.currentNumber >= +this.state.range) {
            this.setState({game_ended: true})
        }
    }

    async onReconnect() {
        try {
            await this.connectServer();
        } catch (error) {
            console.log(error);
        }
    }

    async onDisconnect() {
        this.removeListeners([
            "selected number"
        ]);
    }

    removeListeners(events) {
        events.map(event => socket.off(event));
    }
    //SOCKET END

    async onNewUser() {
        const self = this;
        const name = this.inputText.current.value;
        if (!name || !name.trim()) return alert('Nhập tên cho đàng hoàng');
        socket.emit('new user', name, function (response) {
            if (response.success) {
                self.setState({
                    user: response.data
                });
                localStorage.setItem('find_number_user', JSON.stringify(response.data));
            }
        })
    }

    handleClick(i) {
        if (this.state.game_ended || this.state.squares[i].selected) return;
        const number = this.state.squares[i].number;
        socket.emit('select number', {game_id: this.state.game_id, number: +number}, function (res) {
        })
    }

    renderSquare(i) {
        return (
            Square({
                class: this.state.squares[i].class,
                onClick: () => {
                    this.handleClick(i)
                },
                number: this.state.squares[i].number
            })
        )
    }

    renderBoard() {
        if (!this.state.squares.length) return [];
        const result = [];
        let start = 0;
        while (start < this.state.squares.length) {
            result.push(this.renderSquare(start));
            start++;
        }
        return result;
    }

    renderUserScore(data) {
        return UserScore(data)
    }

    newGame() {
        const self = this;
        const range = +this.inputNumber.current.value;
        if (!range) return;
        socket.emit('new game', Math.min(range, 300), function (res) {
            if (res.success) {
                const squares = window._.shuffle(new Array(+res.data.range).fill(null).map((e, i) => {
                    return {
                        number: i + 1,
                        class: 'square',
                        selected: false
                    }
                }));
                self.setState({
                    game_id: res.data.id,
                    range: res.data.range,
                    currentNumber: res.data.currentNumber,
                    squares,
                    game_ended: false,
                    players: res.data.players,
                });
                setImmediate(() => self.checkGameEnded());
                localStorage.setItem('game_id', res.data.id)
            }
        })
    }

    forceQuit() {
        localStorage.setItem('game_id', '');
        socket.emit('quit game', this.state.game_id);
        this.setState({
            squares: [],
            game_ended: false,
            range: 0,
            currentNumber: 0,
            game_id: null,
            players: []
        });
    }

    joinGame() {
        const game_id = this.inputGameId.current.value;
        const self = this;
        socket.emit('join game', game_id, function (res) {
            if (res.success) {
                const selectedNumber = window._.flatten(res.data.players.map(x => x.selected));
                const squares = window._.shuffle(new Array(+res.data.range).fill(null).map((e, i) => {
                    const number = i + 1;
                    const className = selectedNumber.includes(number) ? 'square selected': 'square';
                    return {
                        number: i + 1,
                        class: className,
                        selected: false
                    }
                }));
                self.setState({
                    game_id: game_id,
                    players: res.data.players,
                    currentNumber: res.data.currentNumber,
                    range: +res.data.range,
                    squares,
                    game_ended: false
                });
                setImmediate(() => self.checkGameEnded());
                localStorage.setItem('game_id', game_id)
            }
        })
    }

    render() {
        const renderNewUser = () => {
            return (
                <div className="form-group">
                    <label>Nhập cái tên vào rồi chơi</label> <br/>
                    <input type="text" ref={this.inputText}/>
                </div>
            );
        };

        const renderScore = () => {
            if (!this.state.game_ended) return [];
            let scores = this.state.players.map(player => {
                return {
                    id: player.id,
                    name: this.state.user.id === player.id ? 'You' : player.name,
                    score: player.selected.length
                };
            });
            scores.sort((a, b) => b.score - a.score);
            scores = scores.map(this.renderUserScore);
            return (
                <div className="mt-2" style={{border: '1px solid grey'}}>
                    <h4>Leaderboard</h4>
                    <ul>
                        {scores}
                    </ul>
                </div>
            )
        };

        const renderNewGame = () => {
            return (
                <div className="form-group">
                    <label>Muốn tìm bao nhiêu số? (max 300)</label> <br/>
                    <input type="number" ref={this.inputNumber}/><br/><br/>
                    <button className="btn btn-primary" onClick={() => this.newGame()}>Game mới nào</button>
                </div>
            )
        };

        const renderJoinGame = () => {
            return (
                <div className="form-group">
                    <label>Dán game id vào đây</label> <br/>
                    <input type="text" ref={this.inputGameId}/> <br/><br/>
                    <button className="btn btn-primary" onClick={() => this.joinGame()}>Vào game thôi</button>
                </div>
            )
        };


        /* GAME CONDITION */
        if (!this.state.user) {
            return (
                <div className="card text-center" style={{margin: 'auto'}}>
                    <div className="card-body">
                        {renderNewUser()}
                        <button className="btn btn-info" onClick={() => this.onNewUser()}>Xong</button>
                    </div>
                </div>
            )
        } else if (!this.state.game_id || this.state.game_ended) {
            return (
                <div className="row">
                    <div className="col-sm-6 col-xs-12">
                        {renderScore()}
                        {renderNewGame()}
                    </div>
                    <div className="col-sm-6 col-xs-12">
                        {renderJoinGame()}
                    </div>
                </div>
            )
        }
        else {
            return (
                <div>
                    <div className="status">
                        <p>Game Id: {this.state.game_id}</p>
                        <p>Số tiếp theo <strong>{this.state.currentNumber + 1}</strong> <button onClick={() => this.forceQuit()}>Quit thôi</button></p>
                    </div>
                    <div className="board" style={this.state.gameStyle}>
                        {this.renderBoard()}
                    </div>
                </div>
            );
        }
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = { width: 0, height: 0 };
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }

    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
    }
    render() {
        return (
            <div className="App">
                <Board width={this.state.width} height={this.state.height}/>
            </div>
        )
    }
}

export default App;
