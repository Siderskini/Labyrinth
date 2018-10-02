function Square(x, y, width, height, color) {
    //	Size variables
    this.width = width;
    this.height = height;
    this.color = color;

    //	Position
    this.x = x;
    this.y = y;

    //	Velocity
    this.vx = 0;
    this.vy = 0;

    //	Acceleration
    this.ax = 0;
    this.ay = 0.5;

    this.onGround = function () {
        if (this.y + this.height >= canvas.height)
            return true;
        else
            return false;
    };

    this.onLeftWall = function () {
        if (this.x <= 0)
            return true;
        else
            return false;
    };

    this.onRightWall = function () {
        if ((this.x + this.width) >= canvas.width)
            return true;
        else
            return false;
    };

    this.update = function () {
        //	Apply velocity to position
        this.x += this.vx;
        this.y += this.vy;

        //	Apply acceleration to velocity
        this.vx += this.ax;
        this.vy += this.ay;

        //	BOUNDS CHECKING
        if (this.onRightWall())	//	RIGHT BOUND
        {
            this.x = canvas.width - this.width;
        }
        else if (this.onLeftWall())	//	LEFT BOUND
        {
            this.x = 0;
        }
        if (this.onGround())	//	ON THE GROUND
        {
            this.y = canvas.height - this.height;
        }
    };

    //	Default function, to give drawing capabilities must apply draw from main
    this.draw = function () {
        console.log("No context has been defined");
    };
}
