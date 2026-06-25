// Shared data used by every page.
// Server data will eventually replace this object when the WebSocket part is connected.
const baseContents = [
  {
    id: "vr",
    name: "VR 건강 체험",
    desc: "균형 감각과 가벼운 운동 동작을 가상 공간에서 체험합니다.",
    reserved: 18,
    completed: 9,
    average: 7,
    accent: "#1f6feb",
    startedAt: Date.now()
  },
  {
    id: "photo",
    name: "AI 사진관",
    desc: "사진 촬영 후 인공지능 보정으로 프로필 이미지를 제작합니다.",
    reserved: 14,
    completed: 10,
    average: 5,
    accent: "#c64f7c",
    startedAt: Date.now()
  },
  {
    id: "kiosk",
    name: "키오스크 연습",
    desc: "주문, 결제, 발권 과정을 실제 상황처럼 천천히 연습합니다.",
    reserved: 21,
    completed: 12,
    average: 6,
    accent: "#d97706",
    startedAt: Date.now()
  },
  {
    id: "robot",
    name: "돌봄 로봇 체험",
    desc: "음성 안내와 생활 보조 기능을 직접 확인합니다.",
    reserved: 11,
    completed: 8,
    average: 9,
    accent: "#6b5bd6",
    startedAt: Date.now()
  }
];

let activeFilter = "all";
const contents = loadContents();

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function loadContents() {
  const now = Date.now();

  try {
    const saved = JSON.parse(localStorage.getItem("smartWaitingContents") || "null");
    if (!Array.isArray(saved)) return cloneBase(now);

    return baseContents.map((base) => {
      const match = saved.find((item) => item.id === base.id);
      return {
        ...base,
        reserved: Number(match?.reserved ?? base.reserved),
        completed: Number(match?.completed ?? base.completed),
        average: Number(match?.average ?? base.average),
        startedAt: now
      };
    });
  } catch (error) {
    return cloneBase(now);
  }
}

function cloneBase(startedAt) {
  return baseContents.map((item) => ({ ...item, startedAt }));
}

function saveContents() {
  const payload = contents.map(({ id, reserved, completed, average }) => ({
    id,
    reserved,
    completed,
    average
  }));

  localStorage.setItem("smartWaitingContents", JSON.stringify(payload));
}

function clock(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function cycleMs(item) {
  return item.average * 60 * 1000;
}

function completedNow(item) {
  const passedCycles = Math.floor((Date.now() - item.startedAt) / cycleMs(item));
  return Math.min(item.reserved, item.completed + passedCycles);
}

function waitingPeople(item) {
  return Math.max(0, item.reserved - completedNow(item));
}

function remainingMs(item) {
  const people = waitingPeople(item);
  if (people === 0) return 0;
  return people * cycleMs(item) - ((Date.now() - item.startedAt) % cycleMs(item));
}

function waitMinutes(item) {
  return Math.ceil(remainingMs(item) / 60000);
}

function entryTime(item) {
  return clock(new Date(Date.now() + remainingMs(item)));
}

function statusText(item) {
  const minutes = waitMinutes(item);
  if (minutes <= 15) return "추천";
  if (minutes >= 40) return "혼잡";
  return "예약 가능";
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1500);
}

// Drawer menu shared by all pages.
function setupDrawer() {
  const drawer = $("#drawer");
  if (!drawer) return;

  $all("[data-menu-open]").forEach((button) => {
    button.addEventListener("click", () => {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
    });
  });

  $all("[data-menu-close]").forEach((button) => {
    button.addEventListener("click", closeDrawer);
  });

  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) closeDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }
}

// Home page: only updates existing HTML cards. It does not create HTML strings.
function setupHomePage() {
  if (document.body.dataset.page !== "home") return;

  $all("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      $all("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderHomePage();
    });
  });

  $all("[data-issue]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = findContent(button.dataset.issue);
      item.reserved += 1;
      saveContents();
      showToast(`${item.name} 대기표를 발급했습니다.`);
      renderHomePage();
    });
  });

  renderHomePage();
  setInterval(renderHomePage, 1000);
}

function renderHomePage() {
  const totalWaiting = contents.reduce((sum, item) => sum + waitingPeople(item), 0);
  const avgWait = Math.round(contents.reduce((sum, item) => sum + waitMinutes(item), 0) / contents.length);
  const fastEntry = Math.min(...contents.map(remainingMs));

  $("#nowTime").textContent = clock(new Date());
  $("#totalWaiting").textContent = totalWaiting;
  $("#avgWait").textContent = `${avgWait}분`;
  $("#fastEntry").textContent = clock(new Date(Date.now() + fastEntry));

  contents.forEach(updateContentCard);
}

function updateContentCard(item) {
  const card = $(`[data-card="${item.id}"]`);
  if (!card) return;

  const minutes = waitMinutes(item);
  const shouldShow =
    activeFilter === "all" ||
    (activeFilter === "fast" && minutes <= 15) ||
    (activeFilter === "busy" && minutes >= 40);

  card.hidden = !shouldShow;
  card.style.setProperty("--accent", item.accent);
  $("[data-status]", card).textContent = statusText(item);
  $("[data-wait]", card).textContent = minutes;
  $("[data-people]", card).textContent = `대기 ${waitingPeople(item)}명`;
  $("[data-average]", card).textContent = `평균 ${item.average}분`;
  $("[data-entry]", card).textContent = `입장 ${entryTime(item)}`;
}

// Ticket page: registers mock ticket data and stores it for other pages.
function setupTicketPage() {
  if (document.body.dataset.page !== "ticket") return;

  $("#issueTicket").addEventListener("click", () => {
    const item = findContent($("#ticketContent").value);
    const count = Math.max(1, Number($("#ticketCount").value || 1));

    item.reserved += count;
    saveContents();
    showToast(`${item.name} 대기표 ${count}장을 등록했습니다.`);
  });
}

function findContent(id) {
  return contents.find((item) => item.id === id) || contents[0];
}

function init() {
  setupDrawer();
  setupHomePage();
  setupTicketPage();
}

init();
