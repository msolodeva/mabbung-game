import type { StageType } from '../ui/Menu';
import { STAGE_THEMES } from './StageThemes';
/** Layered, spatial Web Audio effects; all voices are short-lived and bounded. */
export class AudioManager {
  private ctx:AudioContext|null=null;
  private masterGain:GainNode|null=null;
  private sfxGain:GainNode|null=null;
  private bgmGain:GainNode|null=null;
  private duckGain:GainNode|null=null;
  private noiseBuffer:AudioBuffer|null=null;
  private pan=0;
  private voices=0;
  public soundEnabled=true;
  public musicEnabled=true;
  private isBgmPlaying=false;
  private bgmInterval:number|null=null;
  private bgmStep=0;
  public musicStage:StageType='SUZAKU';
  private nextBeat=0;
  private backgroundPaused=false;

  private init():void {
    if(!this.ctx) {
      const AudioClass=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
      if(!AudioClass)return;
      this.ctx=new AudioClass();
      this.masterGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();this.bgmGain=this.ctx.createGain();this.duckGain=this.ctx.createGain();
      this.masterGain.gain.value=.6;this.sfxGain.gain.value=this.soundEnabled ? .8 : 0;this.bgmGain.gain.value=this.musicEnabled ? .35 : 0;
      this.sfxGain.connect(this.masterGain);this.bgmGain.connect(this.duckGain);this.duckGain.connect(this.masterGain);
      const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=8;limiter.ratio.value=8;limiter.attack.value=.002;limiter.release.value=.12;
      this.masterGain.connect(limiter);limiter.connect(this.ctx.destination);
      this.noiseBuffer=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);
      const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    }
    if(this.ctx.state==='suspended')void this.ctx.resume().catch(()=>{});
  }
  public enableAudio():void {this.init();if(this.musicEnabled&&!this.isBgmPlaying)this.startBGM();}
  public toggleSound():boolean {
    this.soundEnabled=!this.soundEnabled;
    if(this.sfxGain&&this.ctx){this.sfxGain.gain.cancelScheduledValues(this.ctx.currentTime);this.sfxGain.gain.setTargetAtTime(this.soundEnabled ? .8 : 0,this.ctx.currentTime,.008);}
    return this.soundEnabled;
  }
  public toggleMusic():boolean {
    this.musicEnabled=!this.musicEnabled;this.init();
    if(this.bgmGain&&this.ctx)this.bgmGain.gain.setTargetAtTime(this.musicEnabled ? (this.backgroundPaused ? .1 : .35) : 0,this.ctx.currentTime,.03);
    if(this.musicEnabled&&!this.isBgmPlaying)this.startBGM();return this.musicEnabled;
  }
  public setPosition(x:number):void {this.pan=Math.max(-.7,Math.min(.7,(x-800)/700));}
  private duck(duration=.35):void {
    if(!this.soundEnabled||!this.ctx||!this.duckGain)return;
    const t=this.ctx.currentTime,g=this.duckGain.gain;
    g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(.3,t+.02);g.linearRampToValueAtTime(1,t+duration);
  }
  private envelope(source:AudioScheduledSourceNode,duration:number,volume:number,delay:number,filter?:BiquadFilterNode):void {
    const ctx=this.ctx!,t=ctx.currentTime+delay,gain=ctx.createGain(),panner=ctx.createStereoPanner();
    panner.pan.value=this.pan;
    gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.003);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    if(filter){source.connect(filter);filter.connect(gain);}else source.connect(gain);
    gain.connect(panner);panner.connect(this.sfxGain!);this.voices++;
    source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();panner.disconnect();this.voices--;};
    source.start(t);source.stop(t+duration+.01);
  }
  private tone(from:number,to:number,duration:number,volume=.4,type:OscillatorType='sine',delay=0):void {
    if(!this.soundEnabled)return;this.init();if(!this.ctx||this.voices>=48)return;
    const osc=this.ctx.createOscillator(),t=this.ctx.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);
    this.envelope(osc,duration,volume,delay);
  }
  private noise(duration:number,cutoff:number,volume:number,highpass=false,delay=0):void {
    if(!this.soundEnabled)return;this.init();if(!this.ctx||!this.noiseBuffer||this.voices>=48)return;
    const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter();source.buffer=this.noiseBuffer;
    filter.type=highpass?'highpass':'lowpass';filter.frequency.value=cutoff;
    this.envelope(source,duration,volume,delay,filter);
  }
  public playHitLight(combo=0):void {
    const pitch=1+Math.min(combo,6)*.025;
    this.tone(190*pitch,65,.095,.5,'triangle');this.noise(.055,2400,.42,true);this.noise(.075,850,.3);
  }
  public playHitHeavy(combo=0):void {
    this.tone(115,32,.24,.8);this.tone(220+Math.min(combo,6)*8,48,.12,.32,'triangle');
    this.noise(.035,3400,.55,true);this.noise(.2,950,.65);this.noise(.15,420,.25,false,.045);this.duck(.3);
  }
  public playBlock():void {this.tone(860,330,.1,.23,'triangle');this.tone(1350,700,.055,.12);this.noise(.08,2100,.35,true);}
  public playGuardCrush():void {
    this.playHitHeavy();[1400,2100,2900].forEach((f,i)=>this.tone(f,180,.28,.15,'triangle',i*.018));this.noise(.3,3200,.5,true);this.duck(.45);
  }
  public playWhoosh(pitch=300):void {this.tone(pitch,80,.13,.16);this.noise(.13,1300,.22,true);}
  public playRoll():void {this.tone(140,440,.13,.28);this.noise(.2,1100,.35);}
  public playFireballLaunch():void {this.tone(160,740,.1,.3,'triangle');this.tone(560,90,.26,.22,'sawtooth',.045);this.noise(.25,1800,.42);}
  public playDragonPunch():void {this.tone(140,960,.22,.35,'triangle');this.noise(.19,1900,.45,true);}
  public playTatsumaki():void {for(let i=0;i<3;i++){this.tone(440,150,.09,.18,'triangle',i*.065);this.noise(.07,1400,.2,true,i*.065);}}
  public playHyakuretsu():void {for(let i=0;i<4;i++)this.noise(.045,1900,.28,true,i*.045);}
  public playBusterWolf():void {this.playHitHeavy();this.tone(80,25,.5,.65);}
  public playSpecial(character:string,move:string):void {
    if(character==='BLANKA') {
      this.tone(90,65,.27,.27,'sawtooth');for(let i=0;i<5;i++)this.noise(.045,2600,.36,true,i*.035);
    } else if(character==='DHALSIM') {this.noise(.4,950,.65);this.tone(120,45,.32,.28,'triangle');}
    else if(character==='ZANGIEF') {this.tone(170,42,.25,.48);this.noise(.2,600,.48);}
    else if(character==='CAMMY') {this.tone(850,180,.18,.24,'triangle');this.noise(.22,2200,.45,true);}
    else if(move==='uppercut')this.playDragonPunch();
    else if(move==='spin')character==='CHUN_LI'?this.playHyakuretsu():this.playTatsumaki();
    else this.playFireballLaunch();
  }
  public playSuperActivate():void {
    this.tone(100,32,.55,.6);[330,495,660,990].forEach((f,i)=>this.tone(f,f*1.4,.25,.16,'triangle',i*.035));
    this.noise(.32,2800,.4,true);this.duck(.8);
  }
  public playJump():void {this.noise(.09,800,.18);this.tone(140,280,.1,.14);}
  public playLand(heavy=false):void {this.tone(heavy?100:140,45,heavy?.22:.1,heavy?.5:.2);this.noise(heavy?.2:.08,700,heavy?.45:.2);}
  public playKO():void {
    this.tone(85,26,.75,.7);[220,277.18,329.63].forEach((f,i)=>this.tone(f,f*.5,.65,.2,'triangle',i*.04));
    this.noise(.45,900,.6);this.duck(1.1);
  }
  public playAnnounce(type:'fight'|'round'|'ko'|'win'):void {
    this.pan=0;
    const notes=type==='fight'?[330,660,990]:type==='win'?[523.25,659.25,783.99,1046.5]:[220,330];
    notes.forEach((f,i)=>this.tone(f,f,.2,.22,'triangle',i*.09));
    if(type==='fight'){this.tone(95,35,.28,.5);this.noise(.2,1700,.25);}
  }

  public setStage(stage:StageType):void {
    if(this.musicStage===stage)return;
    this.musicStage=stage;this.bgmStep=0;
    if(this.ctx)this.nextBeat=this.ctx.currentTime+.04;
  }
  public setPaused(paused:boolean):void {
    if(paused===this.backgroundPaused)return;
    this.backgroundPaused=paused;
    if(this.ctx&&this.bgmGain)this.bgmGain.gain.setTargetAtTime(this.musicEnabled?(paused?.1:.35):0,this.ctx.currentTime,.08);
  }
  private startBGM():void {
    if(this.isBgmPlaying||!this.ctx||!this.bgmGain)return;
    this.isBgmPlaying=true;this.bgmStep=0;this.nextBeat=this.ctx.currentTime+.03;
    // Schedule slightly ahead of playback instead of using timer callbacks as a musical clock.
    this.bgmInterval=window.setInterval(()=>{
      if(!this.ctx||this.ctx.state!=='running')return;
      if(!this.musicEnabled){this.nextBeat=this.ctx.currentTime+.03;return;}
      if(this.nextBeat<this.ctx.currentTime-.2)this.nextBeat=this.ctx.currentTime+.03;
      const theme=STAGE_THEMES[this.musicStage],duration=60/theme.bpm/4;
      while(this.nextBeat<this.ctx.currentTime+.12) {
        this.scheduleBeat(this.nextBeat,duration);this.nextBeat+=duration;this.bgmStep++;
      }
    },25);
  }
  private bgTone(frequency:number,t:number,duration:number,volume:number,type:OscillatorType='sine',endFrequency?:number):void {
    if(!this.ctx||!this.bgmGain)return;
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;
    osc.frequency.setValueAtTime(frequency,t);
    if(endFrequency)osc.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);
    gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(this.bgmGain);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+duration+.02);
  }
  private bgNoise(t:number,duration:number,volume:number,frequency:number,type:BiquadFilterType,pan=0):void {
    if(!this.ctx||!this.bgmGain||!this.noiseBuffer)return;
    const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),panner=this.ctx.createStereoPanner();
    source.buffer=this.noiseBuffer;source.loop=true;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.5;panner.pan.value=pan;
    gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+Math.min(.15,duration*.2));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(this.bgmGain);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};source.start(t);source.stop(t+duration+.02);
  }
  private scheduleBeat(t:number,step:number):void {
    const theme=STAGE_THEMES[this.musicStage],n=this.bgmStep,melody=theme.melody[n%theme.melody.length];
    if(n%2===0)this.bgTone(theme.root/2*2**(theme.bass[Math.floor(n/4)%theme.bass.length]/12),t,step*1.65,.22,'triangle');
    if(melody>=0) {
      const frequency=theme.root*2**(melody/12);
      this.bgTone(frequency,t,step*(this.musicStage==='SUZAKU'?2.5:1.1),.105,theme.voice);
      if(this.musicStage==='SUZAKU')this.bgTone(frequency*2.01,t,step*1.4,.022,'sine');
    }
    if(n%4===0)this.bgTone(this.musicStage==='SUZAKU'?90:130,t,.17,.38,'sine',38);
    if(n%8===4)this.bgNoise(t,.1,.15,1600,'bandpass');
    if(this.musicStage!=='SUZAKU'&&n%2===1)this.bgNoise(t,.035,.065,6000,'highpass',n%4===1?-.25:.25);
    if(n%32===0) {
      if(theme.ambience==='wind') {this.bgNoise(t,3.2,.065,550,'lowpass',-.25);this.bgTone(1174.66,t,1.3,.055,'sine');}
      if(theme.ambience==='rain')this.bgNoise(t,3,.035,3200,'highpass',.15);
      if(theme.ambience==='traffic') {this.bgNoise(t,2.8,.075,350,'lowpass',.4);this.bgTone(65,t,1.2,.045,'sine',48);}
    }
  }
  public stopBGM():void {
    if(this.bgmInterval!==null){clearInterval(this.bgmInterval);this.bgmInterval=null;}
    this.isBgmPlaying=false;
  }
}
