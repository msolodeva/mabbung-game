// ========================================
// VECTOR2 - 2D Vector Math Utilities
// ========================================

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    addInPlace(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    subtractInPlace(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    multiplyInPlace(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    divide(scalar) {
        if (scalar === 0) return new Vector2(0, 0);
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return this.divide(mag);
    }

    normalizeInPlace() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    distanceTo(v) {
        return this.subtract(v).magnitude();
    }

    distanceToSquared(v) {
        return this.subtract(v).magnitudeSquared();
    }

    angleTo(v) {
        return Math.atan2(v.y - this.y, v.x - this.x);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    lerp(v, t) {
        return new Vector2(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t
        );
    }

    clampMagnitude(maxLength) {
        const mag = this.magnitude();
        if (mag > maxLength) {
            return this.normalize().multiply(maxLength);
        }
        return this.clone();
    }

    equals(v) {
        return this.x === v.x && this.y === v.y;
    }

    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    static fromAngle(angle, length = 1) {
        return new Vector2(
            Math.cos(angle) * length,
            Math.sin(angle) * length
        );
    }

    static random(length = 1) {
        const angle = Math.random() * Math.PI * 2;
        return Vector2.fromAngle(angle, length);
    }

    static zero() {
        return new Vector2(0, 0);
    }

    static up() {
        return new Vector2(0, -1);
    }

    static down() {
        return new Vector2(0, 1);
    }

    static left() {
        return new Vector2(-1, 0);
    }

    static right() {
        return new Vector2(1, 0);
    }
}
