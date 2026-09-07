import type { CharacterType, StageType } from '../ui/Menu';

export const HOME_STAGES:Record<CharacterType,StageType>={
  RYU:'SUZAKU',CHUN_LI:'NEO_TOKYO',CAMMY:'NEO_TOKYO',
  ZANGIEF:'SOUTH_TOWN',DHALSIM:'SUZAKU',BLANKA:'SOUTH_TOWN'
};
export interface StageTheme {
  bpm:number;root:number;melody:number[];bass:number[];voice:OscillatorType;
  ambience:'wind'|'rain'|'traffic';label:string;
}
// Original short motifs; semitone offsets keep each arrangement coherent.
export const STAGE_THEMES:Record<StageType,StageTheme>={
  SUZAKU:{bpm:100,root:146.83,voice:'sine',ambience:'wind',label:'바람 · 종소리 · 오음계 선율',
    melody:[12,-1,19,17,14,-1,12,7,12,-1,14,17,19,17,14,-1,24,-1,19,17,14,-1,12,7,10,12,14,-1,7,-1,12,-1],bass:[0,0,7,7,5,5,0,7]},
  NEO_TOKYO:{bpm:124,root:130.81,voice:'triangle',ambience:'rain',label:'빗소리 · 신스 · 전자 비트',
    melody:[12,19,22,19,15,19,22,24,12,19,22,19,10,17,22,17,8,15,19,15,10,17,22,17,12,19,24,22,19,15,14,10],bass:[0,0,0,7,8,8,10,10]},
  SOUTH_TOWN:{bpm:112,root:110,voice:'triangle',ambience:'traffic',label:'도로 소음 · 베이스 · 드럼 그루브',
    melody:[12,-1,15,17,19,17,15,-1,12,-1,10,12,15,-1,7,-1,17,-1,19,22,19,17,15,-1,12,15,17,15,10,-1,12,-1],bass:[0,7,10,7,5,12,7,10]}
};
