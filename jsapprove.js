// ==========================================================================
// ⚙️ APPROVE MANAGEMENT LOGIC (ฉบับผูกข้อมูล Session จริง & อัปเดตโครงสร้าง Action)
// ==========================================================================

// URL ของ Web App Script ของพี่เจมส์
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

// ประกาศตัวแปร Global ไว้สำหรับเก็บสถานะคำขอ
let currentRowIdToProcess = null;
let currentActiveUser = null;

document.addEventListener("DOMContentLoaded", function () {
  // 🔐 1. ตรวจสอบความปลอดภัยดัก Passport ประจำตัวผู้ใช้ (สไตล์เดียวกับหน้าประวัติเป๊ะ)
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }
  currentActiveUser = JSON.parse(storedUser);

  // ผูก Elements หน้าบ้าน
  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn"); // 🟢 ผูกตัวแปรปุ่ม Sign Out จาก Navbar ตัวใหม่

  // แผนผังแมปปิ้งสายงานของพี่เจมส์
  const careerMap = {
    ST001: "บริหารวิชาการ",
    ST002: "บริหารงบประมาณ",
    ST003: "บริหารงานบุคคล",
    ST004: "บริหารทั่วไป",
    ST005: "บริหารกิจการนักเรียน",
    ST006: "บริหารงานแผนงาน",
    ST007: "ลูกจ้างเหมาบริการ",
    ST008: "ลูกจ้างประจำ",
    ST009: "นักศึกษาฝึกสอน",
    T001: "คุณครู (Teacher)",
    T002: "ลูกจ้าง (Employee)",
  };

  // 🎯 เปลี่ยนมาใช้ .textContent เปลี่ยนชื่อและแผนกแบบเดียวกับหน้าประวัติการลา
  if (userFullNameEl) {
    userFullNameEl.textContent = `${currentActiveUser.prename} ${currentActiveUser.firstname} ${currentActiveUser.lastname}`;
  }
  if (userSubtypeEl) {
    userSubtypeEl.textContent =
      careerMap[currentActiveUser.subtypeID] || currentActiveUser.subtypeID;
  }

  // 🟢 ตั้งค่าเริ่มต้นให้ปฏิทินสิ้นสุด (endDate) เป็นวันปัจจุบัน
  const endDateInput = document.getElementById("endDate");
  if (endDateInput) {
    endDateInput.value = new Date().toISOString().split("T")[0];
  }

  // 🟢 ผูกเหตุการณ์คลิกเข้ากับปุ่มค้นหาข้อมูล
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", fetchLeaveRequests);
  }

  // 🎯 🟢 จุดที่อัปเดตเพิ่มต่อท้าย: ดักจับเหตุการณ์คลิกปุ่ม Sign Out เพื่อล้างเซสชันและเตะกลับ index.html
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("userData"); // ล้างคีย์โควตาประวัติพนักงานออกเพื่อความปลอดภัย
      window.location.href = "index.html"; // เปลี่ยนเส้นทางกลับสู่หน้าแรก
    });
  }
});

// 🔄 ฟังก์ชันดึงข้อมูลแบบกรองเงื่อนไขต้นทาง
function fetchLeaveRequests() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const filterStatus = document.getElementById("filterStatus").value;

  if (!startDate || !endDate) {
    alert(
      "❌ กรุณาเลือกช่วงวันที่ (เริ่มวันที่ยื่น - ถึงวันที่) ให้ครบถ้วนก่อนค้นหาครับ",
    );
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert(
      "❌ วันที่เริ่มต้น ต้องไม่เกิน วันที่สิ้นสุด กรุณาตรวจสอบอีกครั้งครับ",
    );
    return;
  }

  showLoading(true);

  const fetchUrl = `${WEB_APP_URL}?action=getFilteredLeave&startDate=${startDate}&endDate=${endDate}&status=${filterStatus}`;

  fetch(fetchUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      renderTable(data);
      showLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลจากระบบหลังบ้าน!");
      showLoading(false);
      document.getElementById("tableContainer").style.display = "none";
      document.getElementById("emptyState").style.display = "block";
    });
}

// 📊 ฟังก์ชันเรนเดอร์ข้อมูลลงตาราง HTML (เวอร์ชันดักจับสถานะจริงของใบลาเพื่อซ่อนปุ่ม)
function renderTable(requests) {
  const tbody = document.getElementById("approveTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = ""; // เคลียร์ตารางเดิมออกก่อนเสมอ

  if (requests.length === 0) {
    tableContainer.style.display = "none";
    emptyState.querySelector("p").innerText =
      "📭 ไม่พบรายการคำขอลาที่ตรงกับเงื่อนไขในช่วงเวลาดังกล่าว";
    emptyState.style.display = "block";
    return;
  }

  requests.forEach((req) => {
    // 🎯 จัดการแปลง Format วันที่ลา (เริ่ม - สิ้นสุด) ให้สั้นกระชับแบบไทยเหมือนเดิม
    let cleanDateRange = "-";
    if (req.dateRange) {
      if (req.dateRange.includes(" - ")) {
        const dates = req.dateRange.split(" - ");
        cleanDateRange = `${formatFriendlyDate(dates[0])} - ${formatFriendlyDate(dates[1])}`;
      } else {
        cleanDateRange = formatFriendlyDate(req.dateRange);
      }
    }

    // 🎯 🟢 จุดแก้ไขสำคัญ: เช็กสถานะของใบลาแต่ละใบเพื่อเลือกพ่น "ปุ่มกด" หรือ "ป้าย Badge"
    let actionContent = "";

    // แปลงอักษรเป็นตัวพิมพ์เล็กและตัดช่องว่างเพื่อป้องกันเงื่อนไขคลาดเคลื่อน
    const currentStatus = req.status
      ? req.status.toLowerCase().trim()
      : "waiting";

    if (currentStatus === "waiting") {
      // โชว์กลุ่มปุ่มกดจัดการใบลาตามปกติ ถ้าสถานะใบนั้นยังรออนุมัติ
      actionContent = `
        <div class="action-group">
            <button class="btn-action btn-approve" onclick="handleDecision(${req.rowId}, 'APPROVED')">อนุมัติ</button>
            <button class="btn-action btn-reject" onclick="handleDecision(${req.rowId}, 'REJECTED')">ไม่อนุมัติ</button>
        </div>
      `;
    } else if (currentStatus === "approved") {
      // ถ้าใบลาถูกอนุมัติไปแล้ว พ่นป้าย Badge สีเขียวพรีเมียมล้อตามมาตรฐานหน้าอื่น
      actionContent = `<span class="badge approved">อนุมัติแล้ว</span>`;
    } else if (currentStatus === "rejected") {
      // ถ้าใบลาถูกปฏิเสธไปแล้ว พ่นป้าย Badge สีแดงซอฟต์ ๆ
      actionContent = `<span class="badge rejected">ไม่อนุมัติ</span>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${formatDate(req.requestDate)}</td>
            <td><strong>${req.fullName}</strong></td>
            <td>${req.leaveType}</td>
            <td>${cleanDateRange}</td> 
            <td class="text-center">${req.totalDays} วัน</td>
            <td>${req.reason || "-"}</td>
            <td class="text-center">${actionContent}</td> `;
    tbody.appendChild(tr);
  });

  tableContainer.style.display = "block";
  emptyState.style.display = "none";
}

function formatFriendlyDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return dateStr;
    const options = { year: "2-digit", month: "short", day: "numeric" };
    return parsedDate.toLocaleDateString("th-TH", options);
  } catch (e) {
    return dateStr;
  }
}

// 🎯 ฟังก์ชันจัดการเปิดกล่องสั่งการ Modal
function handleDecision(rowId, status) {
  currentRowIdToProcess = rowId;

  if (status === "REJECTED") {
    const rejectModal = document.getElementById("rejectModal");
    rejectModal.style.display = "flex";

    document.getElementById("btnRejectConfirm").onclick = () => {
      rejectModal.style.display = "none";
      executeStatusUpdate(currentRowIdToProcess, "REJECTED");
    };

    document.getElementById("btnRejectCancel").onclick = () => {
      rejectModal.style.display = "none";
    };
  } else if (status === "APPROVED") {
    executeStatusUpdate(currentRowIdToProcess, "APPROVED");
  }
}

/**
 * 📡 ฟังก์ชันหลักในการยิง POST ไปอัปเดตสถานะที่ Google Sheets
 */
function executeStatusUpdate(rowId, status) {
  showLoading(true);

  // ดึงรหัสประจำตัวผู้พิจารณาตัวจริงจาก Session วิ่งเข้าสู่ระบบหลังบ้าน
  const actionUserId =
    currentActiveUser && currentActiveUser.userID
      ? currentActiveUser.userID
      : "UNKNOWN_UID";

  const payload = {
    action: "updateLeaveStatus",
    rowId: rowId,
    status: status,
    actionBy: actionUserId,
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((response) => {
      if (response.status === "success") {
        showLoading(false);

        const successModal = document.getElementById("successModal");
        const msgLabel = document.getElementById("successModalMessage");

        if (status === "APPROVED") {
          msgLabel.innerText = "อนุมัติคำขอนี้เรียบร้อยแล้ว";
        } else {
          msgLabel.innerText = "ปฏิเสธคำขอเรียบร้อยแล้ว";
        }

        successModal.style.display = "flex";

        document.getElementById("btnSuccessClose").onclick = () => {
          successModal.style.display = "none";
          fetchLeaveRequests();
        };
      } else {
        alert(`❌ เกิดข้อผิดพลาดจากระบบหลังบ้าน: ${response.message}`);
        showLoading(false);
      }
    })
    .catch((err) => {
      console.error("Error updating status:", err);
      alert(
        "❌ เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลเข้าสู่ระบบ Google Sheets ได้!",
      );
      showLoading(false);
    });
}

function showLoading(isLoading) {
  const spinner = document.getElementById("loadingSpinner");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

  if (isLoading) {
    spinner.style.display = "flex";
    tableContainer.style.display = "none";
    emptyState.style.display = "none";
  } else {
    spinner.style.display = "none";
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const options = { year: "2-digit", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("th-TH", options);
}

// ==========================================================================
// 🛡️ ระบบรักษาความปลอดภัยกลาง: CHECK SESSION TIMEOUT (10 นาทีอัตโนมัติ)
// ==========================================================================
(function checkSystemSessionTimeout() {
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) return; // ถ้าไม่ได้ล็อกอินปล่อยให้ลอจิกหลักจัดการดีดออก

  const user = JSON.parse(storedUser);
  if (!user.sessionTimeout) return;

  // 🔄 ฟังก์ชันย่อยสำหรับแปลง String "d/M/yyyy, HH:mm:ss" ให้เป็น Date Object ของ JavaScript
  function parseDateTimeStr(str) {
    try {
      // แยกส่วนระหว่าง วันที่ กับ เวลา ด้วย ", "
      const parts = str.split(", ");
      if (parts.length !== 2) return new Date(str);

      const dateParts = parts[0].split("/"); // [d, M, yyyy]
      const timeParts = parts[1].split(":"); // [HH, mm, ss]

      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // เดือนใน JS เริ่มนับจาก 0
      const year = parseInt(dateParts[2], 10);

      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2], 10);

      return new Date(year, month, day, hours, minutes, seconds);
    } catch (e) {
      console.error("Format parse error:", e);
      return new Date(str);
    }
  }

  // ⏰ ตั้งเวลาจับตาดูทุก ๆ 1 วินาที (1000ms) แบบ Real-time
  const sessionInterval = setInterval(function () {
    const now = new Date();
    const expireTime = parseDateTimeStr(user.sessionTimeout);

    // 🚨 ดักจับ: ถ้าเวลาปัจจุบันวิ่งเลยเวลาหมดอายุในระบบ
    if (now.getTime() > expireTime.getTime()) {
      clearInterval(sessionInterval); // สั่งหยุดตัวนับเวลาชั่วคราว

      // ล้างหน่วยความจำความทรงจำทิ้งทันทีป้องกันการแฮกย้อนกลับ
      sessionStorage.removeItem("userData");

      // 🖼️ สร้างกล่องแจ้งเตือนพรีเมียมเด้งขึ้นมากลางหน้าจอ (งอกโค้ดครอบสดโดยไม่พึ่ง Modal HTML เดิม)
      const timeoutOverlay = document.createElement("div");
      timeoutOverlay.style =
        "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); backdrop-filter:blur(5px); display:flex; justify-content:center; align-items:center; z-index:9999; font-family:'Prompt',sans-serif;";

      timeoutOverlay.innerHTML = `
        <div style="background:#ffffff; padding:35px; border-radius:12px; text-align:center; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); max-width:400px; width:90%; animation: slideUp 0.3s ease-out;">
          <div style="font-size:50px; margin-bottom:15px;">⏳</div>
          <h3 style="margin:0 0 10px 0; color:#1e293b; font-size:18px; font-weight:600;">หมดเวลาเข้าใช้งานระบบ</h3>
          <p style="margin:0 0 25px 0; color:#64748b; font-size:14px; line-height:1.5;">เพื่อความปลอดภัยของข้อมูล บัญชีของคุณถูกตัดการเชื่อมโยงเนื่องจากไม่มีการเคลื่อน</p>
          <button id="btnTimeoutRedirect" style="padding:10px 24px; background:#0284c7; color:#ffffff; border:none; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; width:100%;">เข้าสู่ระบบใหม่อีกครั้ง</button>
        </div>
      `;

      document.body.appendChild(timeoutOverlay);

      // ดักจับคลิกปุ่มตกลงเพื่อพาวาร์ปกลับหน้าล็อกอิน
      document
        .getElementById("btnTimeoutRedirect")
        .addEventListener("click", function () {
          window.location.href = "index.html";
        });

      // ป้องกันเผื่อลืมกด สั่งวาร์ปออโต้ไปหน้าแรกเองภายใน 5 วินาที
      setTimeout(function () {
        window.location.href = "index.html";
      }, 5000);
    }
  }, 1000);
})();
