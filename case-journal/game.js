const caseData = [
  {
    id: "cafe",
    title: "사건 일지: 카페 노트북 실종",
    subtitle: "도심 카페 노트북 실종",
    tag: "케이스 파일 014",
    lede: "비 오는 오후, 카페에서 노트북이 사라졌다. CCTV와 영수증, 경비 호출 기록만 남았다.",
    overview:
      "비 오는 오후, 도심 카페에서 손님 민지의 노트북이 사라졌습니다. 내부 CCTV와 영수증, 경비 호출 기록이 남아 있습니다. 당신의 목표는 단서를 바탕으로 사건의 타임라인을 올바르게 재구성하는 것입니다.",
    badges: ["플레이타임 5~8분", "조합 난이도 ★★☆"],
    hints: [
      "카페 결제(라떼 영수증)가 가장 이른 기록입니다.",
      "우산을 든 남성은 배달원이 다녀간 직후 자리에서 일어납니다.",
      "민지는 자리에서 일어난 뒤 다섯 분 이상 돌아오지 않았고, 그 사이 사건이 발생했습니다.",
    ],
    clues: [
      { title: "CCTV-1", text: "12:14 흰 우산을 든 남성이 오른쪽 구석에 앉는다." },
      {
        title: "영수증",
        text: "POS 기록: 12:12 라떼 1잔(민지). 피해자는 가장 먼저 주문을 마쳤다.",
      },
      { title: "CCTV-2", text: "12:16 민지가 휴대폰 영상통화를 하며 자리를 비운다." },
      { title: "배달 픽업", text: "12:18 배달 기사가 카운터에서 디저트를 받아 바로 나간다." },
      { title: "CCTV-3", text: "12:19 우산 남성이 피해자 자리에서 노트북 가방을 닫고 퇴장." },
      { title: "경비 호출 기록", text: "12:23 민지가 복귀해 노트북 실종을 신고한다." },
    ],
    events: [
      {
        id: "victim-order",
        order: 1,
        title: "민지가 라떼를 주문하고 창가 자리에 앉는다",
        detail: "우비를 벗고 가방을 펼쳐 노트북을 꺼낸다.",
      },
      {
        id: "umbrella-enter",
        order: 2,
        title: "흰 우산을 든 남성이 입장해 오른쪽 구석에 앉는다",
        detail: "전화로 누군가와 짧게 통화하며 주변을 둘러본다.",
      },
      {
        id: "victim-leave",
        order: 3,
        title: "민지가 영상통화를 받으며 잠시 자리를 비운다",
        detail: "통화 음성이 커서 바리스타가 카운터로 이동을 권유함.",
      },
      {
        id: "delivery-pickup",
        order: 4,
        title: "배달 기사가 카운터에서 디저트를 받고 즉시 나간다",
        detail: "우산 남성과 눈이 잠깐 마주치지만 대화는 없다.",
      },
      {
        id: "bag-closed",
        order: 5,
        title: "우산 남성이 피해자 자리에서 노트북 가방을 닫고 나간다",
        detail: "민지의 노트북 화면이 꺼지고 가방 지퍼가 잠긴다.",
      },
      {
        id: "report",
        order: 6,
        title: "민지가 돌아와 노트북 실종을 신고한다",
        detail: "경비 호출 버튼이 눌리고 직원이 확인에 동행한다.",
      },
    ],
    reasons: {
      "victim-order": "영수증이 12:12로 가장 이르게 찍힘.",
      "umbrella-enter": "CCTV-1에서 12:14에 등장.",
      "victim-leave": "CCTV-2에서 피해자가 12:16에 자리를 비움.",
      "delivery-pickup": "배달 픽업 로그가 12:18, 우산 남성과 마주친 시점.",
      "bag-closed": "CCTV-3에서 12:19 가방을 닫고 퇴장.",
      report: "경비 호출 기록 12:23이 가장 마지막.",
    },
  },
  {
    id: "subway",
    title: "사건 일지: 지하철 백팩 분실",
    subtitle: "퇴근길 승강장에서 사라진 백팩",
    tag: "케이스 파일 022",
    lede: "퇴근길 지하철역에서 피해자의 백팩이 사라졌다. 하차 기록, 방송 로그, CCTV가 단서다.",
    overview:
      "퇴근 시간대 혼잡한 승강장에서 피해자의 백팩이 사라졌습니다. 교통카드 하차 시간, 역무원 방송 로그, CCTV 일부만 확보되었습니다. 시간순으로 재배치해 가방이 사라진 순간을 파악하세요.",
    badges: ["플레이타임 7~10분", "조합 난이도 ★★★"],
    hints: [
      "교통카드 하차 기록(18:42)이 맨 앞입니다.",
      "분실물 방송은 백팩이 사라진 직후(18:50)에 이루어집니다.",
      "역 밖으로 나간 사람은 에스컬레이터 장면 이후에만 가능합니다.",
    ],
    clues: [
      { title: "교통카드 기록", text: "18:42 홍대입구 하차(피해자)." },
      { title: "CCTV-1", text: "18:44 후드 남성이 피해자 뒤에서 같은 방향으로 이동." },
      { title: "역무원 메모", text: "18:45 시민이 '검은 백팩이 의자에 있다'고 역무실에 전달." },
      { title: "CCTV-2", text: "18:48 에스컬레이터 상단에서 후드 남성이 백팩을 들고 뛰어 오른다." },
      { title: "방송 로그", text: "18:50 역무원 분실물 안내 방송 송출." },
      { title: "신고 기록", text: "18:58 피해자가 역무실에 백팩 분실 신고." },
      { title: "외부 카메라", text: "18:49 출구 3밖으로 후드 남성이 빠르게 걸어 나감." },
    ],
    events: [
      {
        id: "victim-exit",
        order: 1,
        title: "피해자가 18:42 하차 후 플랫폼 의자에 앉아 통화한다",
        detail: "백팩은 바로 옆에 두고 스마트폰 통화에 집중한다.",
      },
      {
        id: "hoodie-follow",
        order: 2,
        title: "후드 남성이 같은 칸에서 내린 뒤 피해자 뒤를 따라 이동",
        detail: "서둘러 폰을 보며 에스컬레이터 방향으로 걷는다.",
      },
      {
        id: "citizen-report",
        order: 3,
        title: "한 시민이 역무실에 '검은 백팩이 놓여 있다'고 알린다",
        detail: "역무원은 방송을 준비하지만 즉시 나가진 않는다.",
      },
      {
        id: "victim-stands",
        order: 4,
        title: "피해자가 통화를 끝내고 지하 1층 매장으로 이동한다",
        detail: "백팩을 잠깐 의자에 둔 채 자리를 비워버린다.",
      },
      {
        id: "escalator-grab",
        order: 5,
        title: "후드 남성이 에스컬레이터 상단에서 백팩을 들고 뛰어오른다",
        detail: "주변 승객이 놀라 피하지만 제지는 없다.",
      },
      {
        id: "exit-door",
        order: 6,
        title: "후드 남성이 출구 3 외부 CCTV에 포착된다",
        detail: "백팩을 오른팔에 메고 빠르게 걷는다.",
      },
      {
        id: "announce",
        order: 7,
        title: "역무원이 18:50 분실물 안내 방송을 송출한다",
        detail: "현장 확인 후 이미 백팩이 사라졌음을 알게 된다.",
      },
      {
        id: "victim-report",
        order: 8,
        title: "피해자가 역무실에 백팩 분실 신고를 한다",
        detail: "18:58 기록, 교통카드 조회를 요청한다.",
      },
    ],
    reasons: {
      "victim-exit": "18:42 교통카드 하차 기록이 첫 사건.",
      "hoodie-follow": "CCTV-1에서 바로 뒤따름(18:44).",
      "citizen-report": "역무원 메모가 18:45로 가장 이른 신고.",
      "victim-stands": "피해자가 통화 후 이동, 백팩이 남겨지는 시점.",
      "escalator-grab": "CCTV-2 18:48에서 백팩을 들고 뛰어오름.",
      "exit-door": "외부 카메라 18:49에 포착.",
      announce: "방송 로그 18:50이 뒤이어 발생.",
      "victim-report": "피해자 신고 18:58이 가장 마지막.",
    },
  },
  {
    id: "camp",
    title: "사건 일지: 야간 캠프 장비 도난",
    subtitle: "폭우 직후 사라진 드론과 카메라",
    tag: "케이스 파일 031",
    lede: "폭우가 그친 숲 캠프장에서 드론·카메라가 사라졌다. 무전 기록과 텐트 간 이동 로그가 단서다.",
    overview:
      "폭우가 막 그친 새벽, 숲속 캠프장에서 드론과 카메라가 사라졌습니다. 무전 교신, 침낭 교대 기록, 발자국과 젖은 장비 흔적을 시간순으로 맞춰 범인의 이동을 추적하세요.",
    badges: ["플레이타임 9~12분", "조합 난이도 ★★★★"],
    hints: [
      "비가 그친 직후(03:10)에 처음 교대가 일어납니다.",
      "드론 프로펠러가 젖은 시점은 폭우 직후여야 합니다.",
      "발자국이 말라가기 시작한 것은 새벽 3시 25분 이후입니다.",
    ],
    clues: [
      { title: "기상 로그", text: "03:08 폭우가 잦아듦, 바람 약해짐." },
      { title: "무전 기록 A", text: "03:10 경계조 A → B 교대 보고." },
      {
        title: "습기 기록",
        text: "03:12 드론 프로펠러와 카메라 삼각대가 젖어 있음. 텐트 안은 마른 상태.",
      },
      { title: "발자국", text: "03:25 이후 흙이 말라가며 남은 발자국 자국이 선명." },
      { title: "무전 기록 B", text: "03:28 B가 '텐트 주변에 발자국 증가' 보고." },
      { title: "CCTV(입구)", text: "03:22 파란 우비를 입은 인물이 장비 텐트 방향으로 이동." },
      { title: "장비 체크", text: "03:32 드론, 카메라가 사라진 것을 확인." },
      { title: "우비 실물", text: "파란 우비가 A 텐트 안에 접혀 있으며 마르지 않은 상태." },
    ],
    events: [
      {
        id: "rain-stop",
        order: 1,
        title: "폭우가 잦아들고 캠프장이 안정된다",
        detail: "03:08 기상 로그에 기록된다.",
      },
      {
        id: "shift-change",
        order: 2,
        title: "경계조 A에서 B로 교대한다",
        detail: "03:10 무전, 둘은 서로 위치를 교대하며 장비 텐트는 비워짐.",
      },
      {
        id: "wet-gear",
        order: 3,
        title: "드론 프로펠러와 카메라 삼각대가 젖은 채 발견된다",
        detail: "03:12 기록, 누군가 텐트를 열어 확인했음을 암시.",
      },
      {
        id: "blue-raincoat",
        order: 4,
        title: "파란 우비 인물이 장비 텐트 쪽으로 이동한다",
        detail: "03:22 입구 CCTV 포착.",
      },
      {
        id: "footsteps",
        order: 5,
        title: "캠프장 주변에 진흙 발자국이 늘어난다",
        detail: "03:25 이후 흙이 마르기 시작하면서 자국이 더 선명해짐.",
      },
      {
        id: "report-footsteps",
        order: 6,
        title: "B가 무전으로 발자국 증가를 보고한다",
        detail: "03:28 무전 기록 B.",
      },
      {
        id: "missing-gear",
        order: 7,
        title: "03:32 장비 텐트에서 드론과 카메라가 사라진 것을 확인",
        detail: "텐트 지퍼는 열려 있고 물기가 적다.",
      },
      {
        id: "raincoat-found",
        order: 8,
        title: "파란 우비가 A 텐트 안에서 발견된다",
        detail: "마르지 않은 상태로 접혀 있어, 바로 직후 벗어둔 것으로 보임.",
      },
    ],
    reasons: {
      "rain-stop": "기상 로그 03:08이 시작점.",
      "shift-change": "무전 기록 A 03:10 교대.",
      "wet-gear": "습기 기록 03:12에 젖은 장비 확인.",
      "blue-raincoat": "CCTV 입구 03:22 포착.",
      footsteps: "발자국이 03:25 이후 말라가기 시작.",
      "report-footsteps": "03:28 무전 보고.",
      "missing-gear": "03:32 장비 분실 확인.",
      "raincoat-found": "우비가 젖은 채 텐트 안에서 발견된 시점이 마지막.",
    },
  },
  {
    id: "harbor",
    title: "사건 일지: 항구 컨테이너 침입",
    subtitle: "야간 교대 사이 사라진 특수 화물",
    tag: "케이스 파일 045",
    lede: "야간 항구에서 특수 화물이 사라졌다. 시간 로그가 뒤엉켜 있어 단순 시간순 정렬로 풀리지 않는다.",
    overview:
      "폭우가 그친 뒤 안개가 짙게 깔린 항구. 특수 화물이 실린 컨테이너에 침입 흔적이 발견되었습니다. CCTV의 시간 싱크가 일부 엇나가 있어 단순한 시간 정렬로 풀 수 없습니다. 인물들의 행동 관계와 단서의 선후관계를 추리해 순서를 맞추세요.",
    badges: ["플레이타임 10~14분", "조합 난이도 ★★★★★"],
    hints: [
      "관제실 출입카드는 가장 먼저 일어난다.",
      "컨테이너 봉인이 손상된 것은 청소 인력이 지나는 것보다 앞서다.",
      "굴착기 기사는 알람이 울린 뒤에야 영역에 들어올 수 없다.",
      "노란 조끼 인부는 항상 빈 손수레보다 먼저 나온다.",
    ],
    clues: [
      { title: "출입카드", text: "관제실 직원(박성우) 야간 교대 직후 출입 기록. 이후 모든 이벤트의 기준점." },
      { title: "CCTV-북문", text: "노란 조끼 인부가 손수레를 끌고 북문 방향 이동. 촬영 시간이 불안정(오차 ±5분)." },
      { title: "무전 로그", text: "보안요원 김가람이 북문 점검 요청. 알람 전에 나온 로그." },
      { title: "CCTV-컨테이너", text: "컨테이너 봉인 띠가 반쯤 뜯겨 있음. 청소 인력보다 앞선 장면." },
      { title: "하역 차량 GPS", text: "굴착기 기사 이도윤, 7번 컨테이너 존에 진입. 알람 이후 기록." },
      { title: "청소 기록", text: "청소 인력(최미나) 북문 근처 바닥 소독. 봉인 훼손을 발견하지 못함." },
      { title: "전화 발신", text: "관제실에서 외부 번호로 12초 통화. 무전 로그 이후." },
      { title: "보안 알람", text: "컨테이너 7번 존 진동 알람 감지. GPS 진입보다 앞선다." },
      { title: "CCTV-출구", text: "노란 조끼 인부가 빈 손수레로 남문 방향 이동. 촬영 시간 오차 있지만 출구장면은 알람 이후." },
      { title: "사후 확인", text: "보안요원이 봉인 훼손을 최종 보고. 모든 이벤트 후." },
    ],
    events: [
      {
        id: "control-entry",
        order: 1,
        title: "관제실 직원 박성우가 출입카드를 찍고 근무를 시작한다",
        detail: "야간 교대 직후, 모든 기록의 기준점.",
      },
      {
        id: "radio-check",
        order: 2,
        title: "보안요원 김가람이 북문 점검을 무전으로 요청한다",
        detail: "알람이 울리기 전 나온 무전 기록.",
      },
      {
        id: "phone-call",
        order: 3,
        title: "관제실에서 외부 번호로 12초간 통화를 한다",
        detail: "무전 로그 바로 뒤에 찍힌 전화 발신.",
      },
      {
        id: "seal-loose",
        order: 4,
        title: "컨테이너 봉인 띠가 반쯤 뜯겨 있는 것이 발견된다",
        detail: "청소 인력이 지나가기 전에 찍힌 장면.",
      },
      {
        id: "yellow-cart",
        order: 5,
        title: "노란 조끼 인부가 손수레를 끌고 북문을 통과한다",
        detail: "CCTV 오차가 있지만 봉인 훼손 이후, 알람 이전.",
      },
      {
        id: "cleaner",
        order: 6,
        title: "청소 인력 최미나가 북문 근처를 소독한다",
        detail: "봉인 훼손을 보지 못했고, 손수레 이동 이후.",
      },
      {
        id: "alarm",
        order: 7,
        title: "컨테이너 존에서 진동 알람이 감지된다",
        detail: "GPS 진입보다 먼저 발생.",
      },
      {
        id: "excavator-entry",
        order: 8,
        title: "굴착기 기사 이도윤이 7번 컨테이너 존에 진입한다",
        detail: "알람 이후 접근, 내부 상태를 확인하러 온다.",
      },
      {
        id: "yellow-exit",
        order: 9,
        title: "노란 조끼 인부가 빈 손수레를 끌고 남문 방향으로 이동한다",
        detail: "출구 장면은 알람 이후, 굴착기 진입보다 뒤.",
      },
      {
        id: "final-report",
        order: 10,
        title: "보안요원이 봉인 훼손을 최종 보고한다",
        detail: "모든 사건이 끝난 뒤 보고.",
      },
    ],
    reasons: {
      "control-entry": "관제실 출입이 기준점이자 가장 앞선 기록.",
      "radio-check": "무전 로그가 알람보다 앞선다는 단서.",
      "phone-call": "전화 발신이 무전 직후라는 단서.",
      "seal-loose": "청소 기록 이후가 아니라는 단서에서 청소 전임.",
      "yellow-cart": "봉인 훼손(4) 이후, 알람(7) 이전이라는 단서.",
      cleaner: "봉인을 못 봤으므로 훼손(4)이 먼저, 손수레 등장(5) 뒤.",
      alarm: "GPS 진입보다 앞선다는 단서.",
      "excavator-entry": "알람 후에 진입한다는 단서.",
      "yellow-exit": "빈 손수레 장면이 알람 이후, 굴착기 진입 후라는 단서.",
      "final-report": "모든 이벤트 후 최종 보고.",
    },
  },
];

const STORAGE_KEY = "case-journal-state";
let currentCase = caseData[0];

const clueGrid = document.getElementById("clue-grid");
const eventList = document.getElementById("event-list");
const resultBox = document.getElementById("result");
const reportBox = document.getElementById("report");
const hintBox = document.getElementById("hint-box");
const checkButton = document.getElementById("check-button");
const resetButton = document.getElementById("reset-button");
const hintButton = document.getElementById("hint-button");
const memoField = document.getElementById("memo-field");
const memoCount = document.getElementById("memo-count");

const caseTitle = document.getElementById("case-title");
const caseSubtitle = document.getElementById("case-subtitle");
const caseLede = document.getElementById("case-lede");
const caseOverview = document.getElementById("case-overview");
const caseTag = document.getElementById("case-tag");
const timelineTitle = document.getElementById("timeline-title");
const timelineIntro = document.getElementById("timeline-intro");
const caseSelect = document.getElementById("case-select");
const caseBadges = document.getElementById("case-badges");
const hintList = hintBox.querySelector("ul");

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getStoredState(caseId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed[caseId] || {};
  } catch {
    return {};
  }
}

function saveState(caseId, state) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  all[caseId] = { ...all[caseId], ...state, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function clearState(caseId) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  delete all[caseId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function renderCaseMeta(theCase) {
  caseTitle.textContent = theCase.title;
  caseSubtitle.textContent = theCase.subtitle;
  caseLede.textContent = theCase.lede;
  caseOverview.textContent = theCase.overview;
  caseTag.textContent = theCase.tag;
  timelineTitle.textContent = `${theCase.events.length}개의 사건을 순서대로 배치하세요`;
  timelineIntro.textContent = "사건 카드를 드래그해서 순서를 맞추세요. 드래그로 순서를 변경할 수 있습니다.";

  caseBadges.innerHTML = "";
  theCase.badges.forEach((badgeText) => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = badgeText;
    caseBadges.append(badge);
  });

  hintList.innerHTML = "";
  theCase.hints.forEach((hint) => {
    const li = document.createElement("li");
    li.textContent = hint;
    hintList.append(li);
  });
  hintBox.removeAttribute("open");
}

function renderClues(theCase) {
  clueGrid.innerHTML = "";
  theCase.clues.forEach((clue) => {
    const card = document.createElement("article");
    card.className = "clue";
    const title = document.createElement("h3");
    title.className = "title";
    title.textContent = clue.title;
    const body = document.createElement("p");
    body.textContent = clue.text;
    card.append(title, body);
    clueGrid.append(card);
  });
}

function handleDragEvents(item) {
  item.addEventListener("dragstart", () => {
    item.classList.add("dragging");
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    document.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
    saveState(currentCase.id, { order: getCurrentOrderIds() });
  });

  item.addEventListener("dragover", (event) => {
    event.preventDefault();
    item.classList.add("drop-target");
    const dragging = document.querySelector(".dragging");
    if (!dragging || dragging === item) return;
    const rect = item.getBoundingClientRect();
    const offset = event.clientY - rect.top;
    const shouldPlaceAfter = offset > rect.height / 2;
    if (shouldPlaceAfter) {
      item.after(dragging);
    } else {
      item.before(dragging);
    }
  });

  item.addEventListener("dragleave", () => {
    item.classList.remove("drop-target");
  });
}

function createEventItem(event) {
  const item = document.createElement("li");
  item.className = "event";
  item.dataset.id = event.id;
  item.draggable = true;

  const title = document.createElement("h3");
  title.className = "title";
  title.textContent = event.title;

  const detail = document.createElement("p");
  detail.className = "detail";
  detail.textContent = event.detail;

  const helper = document.createElement("p");
  helper.className = "detail";
  helper.style.color = "var(--muted)";
  helper.textContent = "이 카드를 드래그해서 순서를 맞추세요.";

  item.append(title, detail, helper);
  handleDragEvents(item);
  return item;
}

function getCurrentOrderIds() {
  return Array.from(eventList.children).map((node) => node.dataset.id);
}

function renderEvents(theCase, { forceShuffle = false } = {}) {
  eventList.innerHTML = "";
  const state = getStoredState(theCase.id);
  const baseOrder = state.order && state.order.length === theCase.events.length ? state.order : null;
  const ids = forceShuffle || !baseOrder ? shuffle(theCase.events).map((e) => e.id) : baseOrder;

  ids.forEach((id) => {
    const event = theCase.events.find((e) => e.id === id);
    if (!event) return;
    const item = createEventItem(event);
    eventList.append(item);
  });

  saveState(theCase.id, { order: getCurrentOrderIds() });
}

function getAssignments() {
  return Array.from(eventList.children).map((node, idx) => {
    const event = currentCase.events.find((e) => e.id === node.dataset.id);
    return {
      ...event,
      chosen: idx + 1,
      node,
    };
  });
}

function clearHighlights() {
  document.querySelectorAll(".event").forEach((node) => {
    node.classList.remove("is-correct", "is-wrong");
  });
}

function renderReport(assignments) {
  reportBox.innerHTML = assignments
    .map((item, idx) => {
      const status = item.chosen === item.order ? "정답" : "오답";
      const reason = currentCase.reasons[item.id] || "관련 단서가 없습니다.";
      return `<p><strong>${idx + 1}. ${item.title}</strong> — ${status} / 근거: ${reason}</p>`;
    })
    .join("");
}

function evaluate() {
  const assignments = getAssignments();
  clearHighlights();

  let correct = 0;
  assignments.forEach((item) => {
    if (item.chosen === item.order) {
      correct += 1;
      item.node.classList.add("is-correct");
    } else {
      item.node.classList.add("is-wrong");
    }
  });

  if (correct === currentCase.events.length) {
    resultBox.textContent = "정답! 사건의 흐름을 정확히 복원했습니다.";
    resultBox.className = "result success";
  } else {
    resultBox.textContent = `${correct}/${currentCase.events.length}개만 맞았습니다. 잘못된 사건에 빨간 표시가 있습니다.`;
    resultBox.className = "result fail";
  }

  renderReport(assignments);
  saveState(currentCase.id, { order: getCurrentOrderIds() });
}

function resetGame() {
  clearHighlights();
  renderEvents(currentCase, { forceShuffle: true });
  resultBox.textContent = "아직 검증하지 않았습니다.";
  resultBox.className = "result";
  reportBox.textContent = "추리 결과 근거가 여기에 표시됩니다.";
  hintBox.removeAttribute("open");
  memoField.value = "";
  updateMemoCount();
  clearState(currentCase.id);
}

function toggleHint() {
  const isOpen = hintBox.hasAttribute("open");
  if (isOpen) {
    hintBox.removeAttribute("open");
  } else {
    hintBox.setAttribute("open", "true");
  }
}

function updateMemoCount() {
  memoCount.textContent = `(${memoField.value.length}/400)`;
  saveState(currentCase.id, { memo: memoField.value, order: getCurrentOrderIds() });
}

function loadCase(caseId) {
  const selected = caseData.find((c) => c.id === caseId);
  currentCase = selected || caseData[0];
  caseSelect.value = currentCase.id;

  renderCaseMeta(currentCase);
  renderClues(currentCase);
  renderEvents(currentCase);

  const state = getStoredState(currentCase.id);
  memoField.value = state.memo || "";
  updateMemoCount();
  resultBox.textContent = "아직 검증하지 않았습니다.";
  resultBox.className = "result";
  reportBox.textContent = "추리 결과 근거가 여기에 표시됩니다.";
}

function init() {
  renderCaseMeta(currentCase);
  renderClues(currentCase);
  renderEvents(currentCase);

  const initialState = getStoredState(currentCase.id);
  memoField.value = initialState.memo || "";
  updateMemoCount();

  checkButton.addEventListener("click", evaluate);
  resetButton.addEventListener("click", resetGame);
  hintButton.addEventListener("click", toggleHint);
  memoField.addEventListener("input", updateMemoCount);
  caseSelect.addEventListener("change", (event) => loadCase(event.target.value));
}

init();
