// ========================================
// ENTITY - Base Entity Class
// ========================================

import { Vector2 } from '../utils/Vector2.js';

/**
 * 모든 게임 엔티티의 기본 클래스
 * 위치, 속도, 충돌 감지 등 공통 기능 제공
 */
export class Entity {
    /**
     * 엔티티 생성
     * @param {number} x - 초기 X 좌표
     * @param {number} y - 초기 Y 좌표
     */
    constructor(x = 0, y = 0) {
        /** @type {number} 고유 식별자 */
        this.id = Entity.nextId++;
        /** @type {Vector2} 월드 좌표 위치 */
        this.position = new Vector2(x, y);
        /** @type {Vector2} 이동 속도 벡터 */
        this.velocity = new Vector2(0, 0);
        /** @type {number} 충돌 감지용 원형 반경 */
        this.radius = 20;
        /** @type {boolean} 활성화 상태 (false면 제거 대상) */
        this.active = true;
        /** @type {string} 엔티티 타입 */
        this.type = 'entity';
    }

    /**
     * 엔티티 물리 업데이트
     * @param {number} deltaTime - 프레임 시간 (초)
     */
    update(deltaTime) {
        this.position.addInPlace(this.velocity.multiply(deltaTime));
    }

    /**
     * 엔티티 렌더링 (하위 클래스에서 오버라이드)
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 컨텍스트
     * @param {Object} camera - 카메라 정보 {x, y, zoom, width, height}
     */
    render(ctx, camera) {
        // Override in subclass
    }

    /**
     * 엔티티의 경계 박스 반환
     * @returns {{x: number, y: number, width: number, height: number}} AABB 경계 박스
     */
    getBounds() {
        return {
            x: this.position.x - this.radius,
            y: this.position.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
        };
    }

    /**
     * 다른 엔티티와의 원형 충돌 감지
     * @param {Entity} other - 충돌 검사할 다른 엔티티
     * @returns {boolean} 충돌 여부
     */
    collidesWith(other) {
        const distance = this.position.distanceTo(other.position);
        return distance < this.radius + other.radius;
    }

    /**
     * 다른 엔티티까지의 거리 계산
     * @param {Entity} other - 대상 엔티티
     * @returns {number} 거리 (픽셀)
     */
    distanceTo(other) {
        return this.position.distanceTo(other.position);
    }

    /**
     * 엔티티 비활성화 (다음 프레임에 제거됨)
     */
    destroy() {
        this.active = false;
    }
}

Entity.nextId = 0;
