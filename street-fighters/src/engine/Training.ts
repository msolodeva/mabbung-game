import type { PlayerInput } from './Input';
export function emptyInput(): PlayerInput {
  return {left:false,right:false,up:false,down:false,lightAttack:false,heavyAttack:false,special:false,superAttack:false,guard:false,lightAttackPressed:false,heavyAttackPressed:false,specialPressed:false,superAttackPressed:false,upPressed:false,downPressed:false,leftPressed:false,rightPressed:false,guardPressed:false,qcfPressed:false,dpPressed:false,qcbPressed:false};
}
