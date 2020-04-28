/**
 *
 */
const MY_NAME = "ytBackgammon Client";
const VERSION = "0.11";

/**
 * common class for Backgammon board items
 */
class BackgammonObj {
    constructor(id, x, y) {
        this.id = id;
        [this.x, this.y] = [x, y];

        this.el = document.getElementById(this.id);

        this.w = this.el.firstChild.width;
        this.h = this.el.firstChild.height;

        this.image_dir = "/static/images/";

        this.el.hidden = false;
        this.el.draggable = false;

        this.move(this.x, this.y, false);
    }

    /**
     * move object to (x, y)
     * @param {number} x
     * @param {number} y
     * @param {boolean} center - center flag
     */
    move(x, y, center=false) {
        [this.x, this.y] = [x, y];

        this.el.style.left = this.x + "px";
        this.el.style.top = this.y + "px";
        if ( center ) {
            this.el.style.left = (this.x - this.w / 2) + "px";
            this.el.style.top = (this.y - this.h / 2) + "px";
        }
    }
} // class BackgammonObj

/**
 *
 */
class OnBoardText extends BackgammonObj {
    constructor(id, x, y, board) {
        super(id, x, y);
        this.board = board;
    }

    set_text(txt) {
        this.el.innerHTML = txt;
    }

    on() {
        this.el.style.borderColor = "rgba(255, 255, 255, 0.7)";
        this.el.style.color = "rgba(255, 255, 255, 0.7)";
    }

    off() {
        this.el.style.borderColor = "rgba(128, 128, 128, 0.5)";
        this.el.style.color = "rgba(128, 128, 128, 0.5)";
    }
} // class OnBoardText

/**
 *
 */
class Checker extends BackgammonObj {
    /**
     * @param {string} id - div tag id
     * @param {number} player - 0 or 1
     * @param {Board} board - board object
     */
    constructor(id, player, board) {
        super(id, 0, 0);
        this.player = player;
        this.board = board;

        [this.src_x, this.src_y] = [this.x, this.y];
        this.z = 0;
        
        this.el.style.cursor = "pointer";

        this.el.onmousedown = this.on_mouse_down.bind(this);
        this.el.ontouchstart = this.on_mouse_down.bind(this);

        this.el.onmouseup = this.on_mouse_up.bind(this);
        this.el.ontouchend = this.on_mouse_up.bind(this);

        this.el.onmousemove = this.on_mouse_move.bind(this);
        this.el.ontouchmove = this.on_mouse_move.bind(this);

        this.el.ondragstart = this.on_drag_start.bind(this);

        this.cur_point = undefined;
    }

    /**
     * @param {number} z
     */
    set_z(z) {
        this.z = z;
        this.el.style.zIndex = this.z;
    }

    /**
     * @return {number} z座標
     */
    calc_z() {
        let z = 0;

        for (let p=0; p < 2; p++) {
            for (let i=0; i < 15; i++) {
                let ch = this.board.checker[p][i];

                if (ch !== this) {
                    let d = this.distance(ch);
                    if ( d < this.w ) {
                        let z1 = ch.z + 1;
                        z = Math.max(z, z1);
                        console.log("calc_z:d=" + d + ", z=" + z);
                    }
                }
            } // for (i)
        } // for (p)

        this.set_z(z);
    }

    /**
     * calcurate distance
     * @param {Checker} ch - distination checker object
     * @return {number} - distance
     */
    distance(ch) {
        let [dx, dy] = [ch.x - this.x, ch.y - this.y];
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     *
     */
    on_mouse_down(e) {
        e.preventDefault();
        if ( e.changedTouches ) {
            e = e.changedTouches[0];
        }
        let [x, y] = this.board.get_xy(e);

        let ch = this;
        console.log("on_mouse_down> ch.id=" + ch.id
                    + ", (x,y)=(" + x + "," + y + ")");
        
        if ( this.player == 1 - this.board.player ) {
            return;
        }

        if ( ch.cur_point !== undefined ) {
            let point = ch.board.point[ch.cur_point];
            ch = point.checkers.slice(-1)[0];
            console.log("on_mouse_down> ch.id=" + ch.id);
        }
        ch.board.moving_checker = ch;

        [ch.src_x, ch.src_y] = [ch.x, ch.y];

        ch.move(x, y, true);
        ch.set_z(1000);

    }

    /**
     *
     */
    on_mouse_up(e) {
        console.log("Checker.on_mouse_up> ");
        e.preventDefault();
        if ( e.changedTouches ) {
            e = e.changedTouches[0];
        }
        let [x, y] = this.board.get_xy(e);

        let ch = this.board.moving_checker;
        if ( ch === undefined ) {
            return;
        }

        console.log("Checker.on_mouse_up> ch.id=" + ch.id
                    + ", (x,y)=(" + x + "," + y + ")");

        ch.move(x, y, true);

        /**
         * destination point index
         * @type {Number}
         */
        let p = ch.board.chpos2point(ch);
        console.log(`Checker.on_mouse_up> p=${p}`);

        /**
         * サイコロ判定
         */
        let active_dice = this.board.get_active_dice();
        console.log(`Checker.on_mouse_up> active_dice=${JSON.stringify(active_dice)}`);

        /**
         * 移動先ポイントに応じた判定
         */
        let can_move = false;
        let hit_ch = undefined;
        let checkers = undefined;

        if ( p >= 0 && p <= ch.board.point.length) {
            checkers = ch.board.point[p].checkers;
            if ( p == 0 ) {
                if ( ch.player == 0 ) {
                    can_move = true;
                }
            } else if ( p == 25 ) {
                if ( ch.player == 1 ) {
                    can_move = true;
                }
            } else if ( p == 26 || p == 27 ) {
                // cannnot move
            } else if ( checkers.length == 0 ) {
                can_move = true;
            } else if ( checkers[0].player == ch.player ) {
                can_move = true;
            } else if ( checkers.length == 1 ) {
                /**
                 * hit
                 */
                can_move = true;
                hit_ch = checkers[0];
            }
        }
            
        if ( ! can_move ) {
            ch.move(ch.src_x, ch.src_y, true);
            ch.board.moving_checker = undefined;
            return;
        }

        if ( hit_ch !== undefined ) {
            console.log(`Checker.on_mouse_up> hit_ch.id=${hit_ch.id}`);

            let bar_p = 27;
            if ( hit_ch.player == 0 ) {
                bar_p = 26;
            }
            ch.board.put_checker(hit_ch, bar_p);
            hit_ch.calc_z();
        }

        ch.board.put_checker(this, p);
        ch.calc_z();

        ch.board.moving_checker = undefined;
    } // on_mouse_up()

    /**
     *
     */
    on_mouse_move(e) {
        e.preventDefault();
        if ( e.changedTouches ) {
            e = e.changedTouches[0];
        }
        let [x, y] = this.board.get_xy(e);

        let ch = this.board.moving_checker;
        if ( ch === undefined ) {
            return;
        }
        
        ch.move(x, y, true);
    }

    /**
     * 
     */
    on_drag_start(e) {
        return false;
    }

} // class Checker

/**
 *
 */
class Cube extends BackgammonObj {
    constructor(id, board) {
        super(id, 0, 0);
        this.board = board;

        this.player = undefined;
        this.value = 1;
        this.accepted = false;
        
        this.x0 = (this.board.bx[0] + this.board.bx[1]) / 2;
        this.y0 = this.board.h / 2;
        this.y2 = [this.board.by[1] - this.h / 2,
                   this.board.by[0] + this.h / 2];
        this.y1 = [(this.y2[0] + this.board.h / 2) / 2,
                   (this.y2[1] + this.board.h / 2) / 2];
        
        this.file_prefix = this.image_dir + "cubeA-";
        this.file_suffix = ".png";

        this.el.style.cursor = "pointer";

        this.el.onmousedown = this.on_mouse_down.bind(this);
        this.el.ontouchstart = this.on_mouse_down.bind(this);

        this.el.onmouseup = this.on_mouse_up.bind(this);
        this.el.ontouchend = this.on_mouse_up.bind(this);

        // this.el.onmousemove = this.on_mouse_move.bind(this);

        this.el.ondragstart = this.on_drag_start.bind(this);

        this.move((this.board.bx[0] + this.board.bx[1]) / 2,
                  this.board.h / 2,
                  true);

        //this.set(1);
        //this.double(1);
    }

    /**
     * 
     */
    set(val, player=undefined, accepted=false, emit=true) {
        console.log("Cube.set(val=" + val
                    + ", player=" + player
                    + ", accepted=" + accepted + ")");
        this.value = val;
        this.player = player;
        this.accepted = accepted;

        if ( player < 0 ) {
            this.player = undefined;
        }

        let filename = this.file_prefix;
        filename += ("0" + val).slice(-2);
        filename += this.file_suffix;

        this.el.firstChild.src = filename;

        if ( this.player === undefined ) {
            this.move(this.x0, this.y0, true);
        } else if ( accepted ) {
            this.player = player;
            this.move(this.x0, this.y2[this.player], true);
        } else {
            this.player = player;
            this.move(this.x0, this.y1[this.player], true);
        }

        if ( emit ) {
            let side = this.player;
            if ( side === undefined ) {
                side = -1;
            }

            this.board.emit_msg('cube', {side: side,
                                         value: this.value,
                                         accepted: this.accepted});
        }
    }

    /**
     * 
     */
    double(player=undefined) {
        console.log("Cube.double(player=" + player + ")");
        if ( player === undefined ) {
            if ( this.player !== undefined ) {
                player = 1 - this.player;
            }
        } else {
            player = 1 - player;
        }
        console.log("Cube.double> player=" + player);

        this.value *= 2;
        if ( this.value > 64 ) {
            this.value = 1;
        }

        this.accepted = false;
        this.set(this.value, player, false);
    }

    /**
     *
     */
    double_accept() {
        console.log("Cube.double_accept()");

        this.set(this.value, this.player, true);
    }

    /**
     *
     */
    double_cancel() {
        console.log("Cube.double_cancel()");
        
        let value = this.value / 2;
        let player = 1 - this.player;
        if ( value == 1 ) {
            player = undefined;
        }
        this.set(value, player, true);
    }

    /**
     *
     */
    on_mouse_down(e) {
        console.log("Cube.on_mouse_down> this.player=" + this.player
                   + ", this.board.player=" + this.board.player);
        e.preventDefault();
        if ( e.changedTouches ) {
            e = e.changedTouches[0];
        }
        if ( this.player !== undefined && this.player != this.board.player ) {
            this.double_cancel();
            return;
        }

        if ( this.player === undefined || this.accepted == true ) {
            this.double(this.board.player);
        } else {
            this.double_accept();
        }
    }

    /**
     *
     */
    on_mouse_up(e) {
        return false;
    }

    /**
     *
     */
    on_drag_start(e) {
        return false;
    }
    
} // class Cube

/**
 *
 */
class Dice extends BackgammonObj {
    constructor(id, x, y, player, file_prefix, board) {
        super(id, x, y);
        this.player = player;
        this.file_prefix = file_prefix;
        this.board = board;

        this.file_suffix = ".png";

        /**
         * ダイスの値
         * @type {number}
         *    0,10: 画面に表示されない
         *    1- 6: 有効な値
         *   11-16: 使えない(使い終わった)状態：暗くなる
         *
        this.value = 0;

        this.el_image = this.el.firstElementChild;

        this.el.hidden = true;
        this.el.style.width = this.el_image.width + "px";
        this.el.style.height = this.el_image.height + "px";
        this.el.style.backgroundColor = "#000";

        this.move(x, y, true);
    }

    /**
     *
     */
    enable() {
        this.el_image.style.opacity = 1.0;
        this.value = this.value % 10;
    }

    /**
     *
     */
    disable() {
        this.el_image.style.opacity = 0.5;
        this.value = this.value % 10 + 10;
    }

    /**
     * @param {number} val - dice number, 11-16 .. disable
     */
    set(val) {
        console.log(`Dice.set(val=${val})>`);
        this.value = val;
        this.el.hidden = true;
        this.enable();

        if (val < 1) {
            return;
        }

        if (val > 10) {
            this.disable();
            val %= 10;
            this.value = val;
        }

        if ( val < 1 || val > 6 ) {
            return;
        }

        this.el.hidden = false;

        const filename = this.image_dir + this.file_prefix + val + this.file_suffix;
        console.log(`Dice.set(val=${val})> filename=${filename}`);
        this.el.firstChild.src = filename;
    }
    
    /**
     *
     */
    roll() {
        this.set(Math.floor(Math.random() * 6) + 1);
        return this.value;
    }
} // class Dice
        
/**
 *
 */
class DiceArea {
    constructor(x, y, w, h, player, board) {
        [this.x, this.y] = [x, y];
        [this.w, this.h] = [w, h];
        this.player = player;
        this.board = board;

        this.active = false;

        let file_prefix = "dice-";
        if ( player == 0 ) {
            file_prefix += "White-";
        } else {
            file_prefix += "Red-";
        }

        this.dice = [];
        this.dice.push(new Dice("dice" + this.player + "0",
                                this.x + this.w / 4,
                                this.y + this.h / 4,
                                this.player,file_prefix, this.board));

        this.dice.push(new Dice("dice" + this.player + "1",
                                this.x + this.w / 4 * 3,
                                this.y + this.h / 4,
                                this.player, file_prefix, this.board));

        this.dice.push(new Dice("dice" + this.player + "2",
                                this.x + this.w / 4,
                                this.y + this.h / 4 * 3,
                                this.player, file_prefix,  this.board));

        this.dice.push(new Dice("dice" + this.player + "3",
                                this.x + this.w / 4 * 3,
                                this.y + this.h / 4 * 3,
                                this.player, file_prefix, this.board));
    }

    /**
     * Set dice values
     * @param {number[][]} dice_value
     * @param {boolean} [emit=true] - emit flag
     */
    set(dice_value, emit=true) {
        console.log(`DiceArea.set(dive_value=${JSON.stringify(dice_value)}, emit=${emit})`);
        
        this.clear();
        
        for (let i=0; i < 4; i++) {
            if ( dice_value[i] < 1 ) {
                continue;
            }
            this.dice[i].set(dice_value[i]);
            this.active = true;
        } // for(i)

        if ( emit ) {
            this.board.emit_msg('dice', {player: this.player,
                                         dice: dice_value});
        }
    }

    /**
     * Get dice values
     * @return {number[]} - dice values
     */
    get() {
        let values = [];
        for (let i=0; i < this.dice.length; i++) {
            values.push(this.dice[i].value);
        }
        console.log(`DiceArea.get> values=${values}`);
        return values;
    }

    /**
     * Roll dices
     * @return {number[]} - dice values
     */
    roll() {
        console.log("DiceArea.roll()");
        this.clear();

        let d1 = Math.floor(Math.random()  * 4);
        let d2 = d1;
        while ( d1 == d2 ) {
            d2 = Math.floor(Math.random()  * 4);
        }
        console.log("d1, d2=" + d1 + ", " + d2);

        this.active = true;

        const value1 = this.dice[d1].roll();
        const value2 = this.dice[d2].roll();

        let dice_value = [0, 0, 0, 0];
        dice_value[d1] = value1;
        dice_value[d2] = value2;

        if ( value1 == value2 ) {
            for ( let d = 0; d < 4; d++ ) {
                this.dice[d].set(value1);
            }
            dice_value = [value1, value1, value1, value1];
        }

        const bar_p = 26 + this.player;
        if ( this.board.point[bar_p].checkers.length > 0 ) {
            /**
             * ヒットされてる場合の確認
             */
            console.log(`DiceArea.roll> hit`);

            let dancing = true;

            for (let d=0; d < 4; d++) {
                if ( dice_value[d] == 0 ) {
                    continue;
                }

                let dst_p = dice_value[d];
                if ( this.player == 0 ) {
                    dst_p = 25 - dice_value[d];
                }
                
                let checkers = this.board.point[dst_p].checkers;
                if ( checkers.length <= 1 || checkers[0].player == this.player ) {
                    dancing = false;
                    break;
                }
            } // for(d)

            if ( dancing ) {
                for (let d=0; d < 4; d++) {
                    if ( dice_value[d] == 0 ) {
                        continue;
                    }
                    this.dice[d].disable();
                    dice_value[d] += 10;
                }
                console.log(`DiceArea.roll> dice_value=${JSON.stringify(dice_value)}`);
            }
        }

        /**
         * emit
         */
        this.board.emit_msg('dice', {player: this.player, dice: dice_value});

        return dice_value;
    }

    /**
     *
     */
    enable(dice) {
        this.dice[dice].enable();
    }

    /**
     *
     */
    disable(dice) {
        this.dice[dice].disable();
    }

    /**
     *
     */
    clear(emit=false) {
        console.log("DiceArea.clear()");
        for ( let d=0; d < 4; d++ ) {
            this.dice[d].set(0);
            this.dice[d].el.hidden = true;
            this.enable(d);
        }
        this.active = false;

        if ( emit ) {
            this.board.emit_msg('dice', {player:this.player,
                                         dice: [0, 0, 0, 0]});
        }
        return [];
    }

    /**
     *
     */
    in_this(x, y) {
        return (x >= this.x) && (x <= this.x + this.w)
            && (y >= this.y) && (y <= this.y + this.h);
    }
}

/**
 *
 *           bx[0]                  bx[3]                 bx[5]
 *           |   bx[1]              |   bx[4]             |bx[6]
 *         x |   |bx[2]             |   |                 ||   bx[7]
 *         | |   ||                 |   |                 ||   |
 *         v v   vv                 v   v                 vv   v
 *     y ->+-----------------------------------------------------
 *         |       13 14 15 16 17 18     19 20 21 22 23 24       |
 * by[0] ->|  -------------------------------------------------  |
 *         | |   ||p0          p1   |   |p1             p0||   | |
 *         | |   ||p0          p1   |   |p1 tx     dx   p0||   | |
 *         | |   ||p0          p1   |27 |p1 |      |      ||25 | |
 *         | |   ||p0               |   |p1 |      v      ||   | |
 *         | |   ||p0               |   |p1 v      +------+<---------dy
 *         | |   ||         ty ------------>+------| Dice ||   | |
 *         | |   ||                 |---|   |Text  | Area ||---| |
 *         | |   ||                 |   |    ------|      ||   | |
 *         | |   ||p1               |   |p0         ------||   | |
 *         | |   ||p1               |   |p0               ||   | |
 *         | |   ||p1          p0   |26 |p0               || 0 | |
 *         | |   ||p1          p0   |   |p0             p1||   | |
 *         | |   ||p1          p0   |   |p0             p1||   | |
 * by[1] ->|  -------------------------------------------------  |
 *         |       12 11 10  9  8  7      6  5  4  3  2  1       |
 *          ----------------------------------------------------- 
 *
 */
class Board extends BackgammonObj {
    /*
     * @param {string} id - div tag id
     * @param {number} x - 
     * @param {number} y - 
     * @param {number} player - 0 or 1
     * @param {io.connect} ws - websocket
     */
    constructor(id, x, y, player, ws) {
        super(id, x, y);

        this.player = player;
        this.ws = ws;
        
        this.turn = -1;

        this.bx = [27, 81, 108, 432, 540, 864, 891, 945];
        this.by = [27, 711];
        [this.tx, this.ty] = [560, 335];
        [this.dx, this.dy] = [740, 320];

        // Title
        const name_el = document.getElementById("name");
        name_el.style.left = "35px";
        // name_el.style.top = "0px";
        const ver_el = document.getElementById("version");
        ver_el.innerHTML = `<strong>${MY_NAME}</strong>, Version ${VERSION}`;

        // Buttons
        const button_top = this.y + this.h + 10;
        
        // * Undo button
        this.undo_el = document.getElementById("button-undo");
        const undo_width = this.undo_el.firstElementChild.width;
        this.undo_el.style.left = (this.w / 2 - undo_width - 30 + this.x)
            + "px";
        this.undo_el.style.top = button_top + "px";

        this.undo_el.onmousedown = e => { this.emit_msg('back', {}); };
        this.undo_el.ontouchstart = e => { this.emit_msg('back', {}); };
        this.undo_el.onmouseup = this.null_handler.bind(this);
        this.undo_el.ontouchend = this.null_handler.bind(this);
        this.undo_el.onmousemove = this.null_handler.bind(this);
        this.undo_el.ontouchmove = this.null_handler.bind(this);
        this.undo_el.ondragstart = this.null_handler.bind(this);
        
        // * Redo button
        this.redo_el = document.getElementById("button-redo");
        this.redo_el.style.left = (this.w / 2 + 30) + this.x + "px";
        this.redo_el.style.top = button_top + "px";

        this.redo_el.onmousedown = e => { this.emit_msg('forward', {}); };
        this.redo_el.ontouchstart = e => { this.emit_msg('forward', {}); };
        this.redo_el.onmouseup = this.null_handler.bind(this);
        this.redo_el.ontouchend = this.null_handler.bind(this);
        this.redo_el.onmousemove = this.null_handler.bind(this);
        this.redo_el.ontouchmove = this.null_handler.bind(this);
        this.redo_el.ondragstart = this.null_handler.bind(this);

        // * Inverse button
        this.inverse_el = document.getElementById("button-inverse");
        const inverse_width = this.inverse_el.firstElementChild.width;
        this.inverse_el.style.left = (this.x + this.w / 2 - inverse_width / 2)
            + "px";
        this.inverse_el.style.top = button_top + "px";
        
        this.inverse_el.onmousedown = e => { this.inverse(); };
        this.inverse_el.ontouchstart = e => { this.inverse(); };
        this.inverse_el.onmouseup = this.null_handler.bind(this);
        this.inverse_el.ontouchend = this.null_handler.bind(this);
        this.inverse_el.onmousemove = this.null_handler.bind(this);
        this.inverse_el.ontouchmove = this.null_handler.bind(this);
        this.inverse_el.ondragstart = this.null_handler.bind(this);
        
        // <body>
        let body_el = document.body;
        body_el.style.width = (this.w * 2) + "px";
        body_el.style.height = (this.h * 2) + "px";

        // OnBoardText
        this.txt = [];
        this.txt.push(new OnBoardText("p0text", this.tx, this.ty, this));
        this.txt.push(new OnBoardText("p1text", this.w - this.tx, this.h - this.ty, this));

        this.txt[1].el.style.transformOrigin = "top left";
        this.txt[1].el.style.transform = "rotate(180deg)";

        for ( let p=0; p < 2; p++ ) {
            this.txt[p].set_text("Player " + (p + 1) + "<br />"
                                 + "This is test.");
            this.txt[p].on();
        }

        // Checkers
        this.checker = [Array(15), Array(15)];
        for (let player=0; player < 2; player++) {
            for (let i=0; i < 15; i++) {
                let c_id = "p" + player + ("0" + i).slice(-2);
                console.log("c_id=" + c_id);
                this.checker[player][i] = new Checker(c_id, player, this);
            }
        }

        this.moving_checker = undefined;

        // Cube
        this.cube = new Cube("cube", this);

        // Points
        this.point = Array(28);
        
        for ( let p=0; p < this.point.length; p++ ) {
            let cn = 5;
            let pw = this.checker[0][0].w;
            let ph = this.h / 2 - this.by[0];

            if ( p == 0 ) {
                let x0 = this.bx[6];
                let y0 = this.by[0] + (this.by[1] - this.by[0]) / 2;
                this.point[p] = new BoardPoint(x0, y0, pw, ph,
                                               -1, cn, this);
            }
            if ( p >= 1 && p <= 6 ) {
                let x0 = this.bx[4];
                let y0 = this.by[0] + (this.by[1] - this.by[0]) / 2;
                let xn = 6 - p;
                let x = x0 + pw * xn;
                this.point[p] = new BoardPoint(x, y0, pw, ph,
                                               -1, cn, this);
            }
            if ( p >= 7 && p <= 12 ) {
                let x0 = this.bx[2];
                let y0 = this.by[0] + (this.by[1] - this.by[0]) / 2;
                let xn = 12 - p;
                let x = x0 + pw * xn;
                this.point[p] = new BoardPoint(x, y0, pw, ph,
                                               -1, cn, this);
            }
            if ( p >= 13 && p <= 18 ) {
                let x0 = this.bx[2];
                let y0 = this.by[0];
                let xn = p - 13;
                let x = x0 + pw * xn;
                this.point[p] = new BoardPoint(x, y0, pw, ph,
                                               1, cn, this);
            }
            if ( p >= 19 && p <= 24 ) {
                let x0 = this.bx[4];
                let y0 = this.by[0];
                let xn = p - 19;
                let x = x0 + pw * xn;
                this.point[p] = new BoardPoint(x, y0, pw, ph,
                                               1, cn, this);
            }
            if ( p == 25 ) {
                let x0 = this.bx[6];
                let y0 = this.by[0];
                this.point[p] = new BoardPoint(x0, y0, pw, ph,
                                               1, cn, this);
            }
            if ( p == 26 ) {
                let x0 = this.bx[3];
                let y0 = this.by[0] + (this.by[1] - this.by[0]) / 2;
                let pw = this.bx[4] - this.bx[3];
                this.point[p] = new BoardPoint(x0, y0, pw, ph,
                                               1, cn, this);
            }
            if ( p == 27 ) {
                let x0 = this.bx[3];
                let y0 = this.by[0];
                let pw = this.bx[4] - this.bx[3];
                this.point[p] = new BoardPoint(x0, y0, pw, ph,
                                               -1, cn, this);
            }
        } // for

        // DiceArea
        let da_w = this.bx[5] - this.dx;
        let da_h = this.h - this.dy * 2;
        this.dice_area = [];
        this.dice_area.push(new DiceArea(this.dx, this.dy, da_w, da_h,
                                           0, this));
        this.dice_area.push(new DiceArea(this.bx[2], this.dy, da_w, da_h,
                                         1, this));
        // this.dice_value = [[], []];

        // Event handlers
        this.el.onmousedown = this.on_mouse_down.bind(this);
        this.el.ontouchstart = this.on_mouse_down.bind(this);

        this.el.onmouseup = this.null_handler.bind(this);
        this.el.ontouchend = this.null_handler.bind(this);

        this.el.onmousemove = this.on_mouse_move.bind(this);
        this.el.ontouchmove = this.on_mouse_move.bind(this);

        this.el.ondragstart = this.null_handler.bind(this);

        if ( this.player == 1 ) {
            this.player = 0;
            this.inverse();
        }
    }

    /**
     * search checker object by checker id
     * @param {string} ch_id - checker id
     * @return {Checker | undefined} - checker object or undefined
     */
    search_checker(ch_id) {
        console.log('search_checker> ' + ch_id);
        let player = parseInt(ch_id[1]);
        console.log('search_checker> ' + player);

        for (let i=0; i < 15; i++) {
            let ch = this.checker[player][i];
            if ( ch.id == ch_id ) {
                return ch;
            }
        }
        return undefined;
    }

    /**
     * emit message to server
     * @param {string} type - message type
     * @param {Object} data - message data
     */
    emit_msg(type, data) {
        console.log(`Board.emit_msg(type=${type}`
                    + `, data=${JSON.stringify(data)})`);
        this.ws.emit('json', {src: this.player, type: type, data: data});
    }

    /**
     * set turn
     * @param {number} player
     */
    set_turn(player) {
        this.turn = player;
        console.log('turn=' + this.turn);
        
        this.txt[0].on();
        this.txt[1].on();

        if ( player == 0 || player == 1 ) {
            this.txt[1 - player].off();
        }
    }
    
    /**
     * 使えるダイスを取得
     * @return {number[]}
     */
    get_active_dice() {
        let active_dice = [];

        const dice_value = this.dice_area[this.player].get();
        for (let i=0; i < dice_value.length; i++) {
            let v = dice_value[i];
            if ( v >= 1 && v <= 6 ) {
                active_dice.push(v);
            }
        }

        console.log(`Board.get_active_dice()> active_dice=${JSON.stringify(active_dice)}`);
        return active_dice;
    }

    /**
     * load all game information
     * @param {Object} gameinfo - game information object
     */
    load_gameinfo(gameinfo) {
        console.log(`Board.load_info()`);

        // escape checkers
        for (let player=0; player < 2; player++) {
            for (let i=0; i < 15; i++) {
                let ch = this.checker[player][i];
                ch.el.hidden = true;
                ch.cur_point = undefined;
                ch.move(0, 0);
            }
        }

        // clear points
        for (let i=0; i < this.point.length; i++) {
            this.point[i].checkers = [];
        } // for(i)

        // put checkers
        let p = gameinfo.board.point;
        let p_idx = [0, 0];
        for (let i=0; i < p.length; i++) {
            if ( p[i].length == 0 ) {
                continue;
            }

            for (let j=0; j < p[i].length; j++) {
                let player = p[i][0];
                let ch = this.checker[player][p_idx[player]];
                this.put_checker(ch, i, false);
                ch.el.hidden = false;
                p_idx[player]++;
            } // for (j)
        } // for(i)

        // turn
        this.set_turn(gameinfo.turn);

        // cube
        let c = gameinfo.board.cube;
        console.log('c=' + JSON.stringify(c));
        this.cube.set(c.value, c.side, c.accepted, false);

        // dice
        let d = gameinfo.board.dice;
        console.log('d=' + JSON.stringify(d));
        this.dice_area[0].set(d[0], false);
        this.dice_area[1].set(d[1], false);
    }

    /**
     *
     */
    inverse() {
        console.log(`Board.inverse()`);
        
        this.player = 1 - this.player;

        this.el.style.transformOrigin = (this.w / 2) + "px "
            + (this.h / 2) + "px";
        if ( this.player == 0 ) {
            this.el.style.transform = "rotate(0deg)";
        } else {
            this.el.style.transform = "rotate(180deg)";
        }
    }

    /**
     *
     */
    inverse_xy(e) {
        return [this.w - e.pageX + this.x, this.h - e.pageY + this.y];
    }
    
    /**
     *
     */
    get_xy(e) {
        let [x, y] = [e.pageX - this.x, e.pageY - this.y];
        if ( this.player == 1 ) {
            [x, y] = this.inverse_xy(e);
        }
        return [x, y];
    }

    /**
     * mouse down handler
     */
    on_mouse_down(e) {
        let orig_e = e;
        if ( e.changedTouches ) {
            e = e.changedTouches[0];
        }
        let [x, y] = this.get_xy(e);

        /*
        // inverse
        if ( y < this.by[0] || y > this.by[1] ) {
            this.inverse();
            console.log("Board.player=" + this.player);
            orig_e.preventDefault();
            return;
        }

        // back
        if ( x < this.bx[0] ) {
            console.log("Board.on_mouse_down> back");
            this.emit_msg('back', {});
        }

        // forward
        if ( x > this.bx[7] ) {
            console.log("Board.on_mouse_down> forward");
            this.emit_msg('forward', {});
        }
        */

        // dice area
        let da = this.dice_area[this.player];
        if ( da.in_this(x, y) ) {
            if ( da.active ) {
                da.clear(true);
            } else {
                da.roll();
            }
            let dice_values = da.get();
            console.log(`Board.on_mouse_down> dice_values=${JSON.stringify(dice_values)}`);
        }
    }

    /**
     * mouse move handler
     */
    on_mouse_move(e) {
        // e.preventDefault();
        if ( e.changedTouches ) {
            e = e.changedTouches[0];
        }
        if ( this.moving_checker === undefined ) {
            return;
        }

        let [x, y] = this.get_xy(e);

        this.moving_checker.move(x, y, true);
    }

    /**
     * null handler
     */
    null_handler(e) {
        return false;
    }

    /**
     * checker position(x, y) to  piont index
     * @param {Checker} ch - checker object
     */
    chpos2point(ch) {
        let point = undefined;

        for ( let i=0; i < this.point.length; i++ ) {
            if ( this.point[i].in_this(ch) ) {
                return i;
            }
        }
        return undefined;
    }

    /**
     * 
     * @param {Checker} ch - Checker
     * @param {number} p - point index
     * @param {boolean} [emit=true] - emit flag
     */
    put_checker(ch, p, emit=true) {
        console.log(`Board.put_checker(ch.id=${ch.id}, p=${p}, emit=${emit})`);

        let prev_p = undefined;

        if ( ch.cur_point !== undefined ) {
            prev_p = ch.cur_point;
            console.log(`Board.put_checker> prev_p=${prev_p}`);
            ch = this.point[prev_p].checkers.pop();
            console.log(`Board.put_checker> ch.id=${ch.id}`);
        }

        let po = this.point[p];
        let ch_n = po.checkers.length;
        let z = Math.floor(ch_n / po.max_n);
        let n = ch_n % po.max_n;
        let x = po.cx;
        let y = po.y0 + (ch.h / 2 + ch.h * n + ch.h / 5 * z) * po.direction;
        ch.move(x, y, true);
        ch.calc_z();
        ch.cur_point = p;

        po.checkers.push(ch);

        if ( emit ) {
            this.emit_msg('put_checker', {ch: ch.id, p1: prev_p, p2: p});
        }
    }
}

/**
 * 
 */
class BoardPoint {
    constructor(x, y, w, h, direction, max_n, board) {
        [this.x, this.y] = [x, y];
        [this.w, this.h] = [w, h];
        this.direction = direction; // up: +1, down: -1
        this.max_n = max_n;
        this.baord = board;

        this.cx = this.x + this.w / 2;

        if ( this.direction > 0 ) {
            this.y0 = this.y;
        } else {
            this.y0 = this.y  + this.h;
        }

        this.checkers = [];
    }
    
    /**
     *
     */
    in_this(ch) {
        if ( ch.x >= this.x && ch.x < this.x + this.w &&
             ch.y >= this.y && ch.y < this.y + this.h ) {
            return true;
        }
        return false;
    }
}

/**
 *
 */
window.onload = function () {
    let url = "http://" + document.domain + ":" + location.port + "/";
    let ws = io.connect(url);

    let player = 0;
    if ( location.pathname == "/p2" ) {
        player = 1;
    }

    let board = new Board("board", 10, 50, player, ws);

    /**
     *
     */
    const emit_msg = (type, data) => {
        ws.emit('json', {src: player, type: type, data: data});        
    };

    ws.on('connect', function() {
        console.log('connected');

    });

    ws.on('disconnect', function() {
        console.log('disconnected');
    });

    ws.on('json', function(msg) {
        console.log("msg> " + JSON.stringify(msg));

        /*
        if ( msg.src == player ) {
            console.log('msg> ignore');
            return;
        }
        */

        if ( msg.type == 'gameinfo' ) {
            board.load_gameinfo(msg.data);
        }

        if ( msg.type == 'put_checker' ) {
            let ch = board.search_checker(msg.data.ch);
            console.log('ch.id = ' + ch.id);
            board.put_checker(ch, msg.data.p2, false);
        }

        if ( msg.type == 'cube' ) {
            board.cube.set(msg.data.value,
                           msg.data.side,
                           msg.data.accepted,
                           false);
        }

        if ( msg.type == 'dice' ) {
            board.dice_area[msg.data.player].set(msg.data.dice, false);
        }
    });
};
