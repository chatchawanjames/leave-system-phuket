// ==========================================================================
// ⚙️ SUBSTITUTE MANAGEMENT LOGIC (ฉบับจัดการตัวแทนสอนแทน & ส่งออก Excel)
// ==========================================================================

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

let currentActiveUser = null;
let masterStaffMap = {}; // เก็บรายชื่อบุคลากรแยกตามแผนกที่ส่งมาจากหลังบ้าน

document.addEventListener("DOMContentLoaded", function () {
  // 🔐 1. ตรวจสอบความปลอดภัยเซสชัน
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }
  currentActiveUser = JSON.parse(storedUser);

  // ผูก Elements หน้า Navbar
  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn");

  // ผูก Elements ระบบค้นหาและตาราง
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const filterStatusSelect = document.getElementById("filterStatus");
  const searchBtn = document.getElementById("searchBtn");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

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
    T001: "ข้าราชการครู",
    T002: "พนักงานราชการ",
  };

  if (userFullNameEl)
    userFullNameEl.textContent = `${currentActiveUser.prename} ${currentActiveUser.firstname} ${currentActiveUser.lastname}`;
  if (userSubtypeEl)
    userSubtypeEl.textContent =
      careerMap[currentActiveUser.subtypeID] || currentActiveUser.subtypeID;

  // ตั้งปฏิทิน endDate เป็นวันปัจจุบัน
  if (endDateInput) {
    endDateInput.value = new Date().toISOString().split("T")[0];
  }

  // ผูกคลิกปุ่มค้นหาคำขอ
  if (searchBtn) {
    searchBtn.addEventListener("click", fetchSubstituteRequests);
  }

  // ผูกคลิกปุ่มส่งออก Excel
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", exportTableToExcel);
  }

  // ผูกคลิกปุ่ม Sign Out
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("userData");
      window.location.href = "index.html";
    });
  }
});

// 🔄 ฟังก์ชันจัดรูปแบบวันที่ Friendly Date (dd/mm/yyyy)
function formatFriendlyDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

// 📡 1. ฟังก์ชันดึงข้อมูลใบลาที่ต้องการตัวแทนและรายชื่อบุคลากรจับคู่ขนาน
function fetchSubstituteRequests() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const filterStatus = document.getElementById("filterStatus").value;

  if (!startDate || !endDate) {
    alert("❌ กรุณาเลือกช่วงวันที่ให้ครบถ้วนก่อนค้นหาครับ");
    return;
  }

  toggleLoading(true);

  // ส่งขากรองต้นทางพร้อมสถานะ Pending / Assigned ไปสกัดบนคลาวด์หลังบ้าน
  const fetchUrl = `${WEB_APP_URL}?action=getSubstitutesAndRequests&startDate=${startDate}&endDate=${endDate}&status=${filterStatus}`;

  fetch(fetchUrl)
    .then((res) => res.json())
    .then((response) => {
      toggleLoading(false);
      //   console.log("=== ตรวจสอบดาต้าหลังบ้าน ===", response);
      if (response.status === "success") {
        masterStaffMap = response.staffMap || {}; // เมมโมรี่จำรายชื่อคนในแต่ละแผนกไว้เลือก
        renderSubstituteTable(response.data, filterStatus);
      } else {
        alert("❌ ข้อผิดพลาดหลังบ้าน: " + response.message);
      }
    })
    .catch((err) => {
      console.error(err);
      toggleLoading(false);
      alert("❌ ไม่สามารถเชื่อมต่อระบบหลังบ้านได้");
    });
}

// 📊 2. ฟังก์ชันเรนเดอร์ข้อมูลคำขอลาลงในตาราง
function renderSubstituteTable(requests, filterStatus) {
  const tbody = document.getElementById("substituteTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");
  const exportExcelBtn = document.getElementById("exportExcelBtn");

  tbody.innerHTML = "";

  if (!requests || requests.length === 0) {
    tableContainer.style.display = "none";
    exportExcelBtn.style.display = "none";
    emptyState.querySelector("p").innerText =
      "📭 ไม่พบรายการคำขอลาที่ต้องการตัวแทนในเงื่อนไขดังกล่าว";
    emptyState.style.display = "block";
    return;
  }

  requests.forEach((req) => {
    const tr = document.createElement("tr");

    // ตั้งค่าเบื้องต้นให้ช่องตัวเลือกผู้รับงานแทน
    let allocationCell = "";

    if (filterStatus === "pending_assignment") {
      // ⏳ กรณีคัดเอาใบลาที่ "ยังไม่ได้มอบหมายงาน" -> สร้างกล่อง Dropdown มอบหมายงาน
      const subtypeKey = req.subtypeId;
      const availableStaff = masterStaffMap[subtypeKey] || [];

      let optionsHtml = `<option value="">-- เลือกบุคลากรในแผนก --</option>`;
      availableStaff.forEach((staff) => {
        // ดักห้ามไม่ให้เลือกตัวเองมาเป็นคนสอนแทนตัวเอง
        if (staff.userID !== req.userId) {
          optionsHtml += `<option value="${staff.userID}">${staff.firstname} ${staff.lastname}</option>`;
        }
      });

      allocationCell = `
        <select class="select-substitute" id="select_${req.rowId}">
          ${optionsHtml}
        </select>
      `;
    } else {
      // ✅ กรณีเลือกใบลาที่ "มอบหมายสำเร็จแล้ว" -> พ่นข้อความชื่อคนเข้าแทนสอนนิ่ง ๆ สวยงาม
      allocationCell = `<span class="text-success-assigned"><i class="bi bi-person-check-fill"></i> ${req.substituteName || req.substituteId}</span>`;
    }

    // จัดปุ่ม action ตามสถานะ
    let actionCell = "";
    if (filterStatus === "pending_assignment") {
      actionCell = `<button class="btn-save-row" onclick="saveSubstituteRow(${req.rowId})">บันทึกข้อมูล</button>`;
    } else {
      actionCell = `<span style="color: #64748b; font-size: 13px;">ลงบันทึกสำเร็จแล้ว</span>`;
    }

    tr.innerHTML = `
      <td><b>${req.leaveId}</b></td>
      <td><strong>${req.fullName}</strong></td>
      <td>${req.leaveType}</td>
      <td style="white-space: normal; max-width: 200px;">${req.reason || "-"}</td>
      <td>${formatFriendlyDate(req.startDate)}</td>
      <td>${formatFriendlyDate(req.endDate)}</td>
      <td>${req.totalDays} วัน</td>
      <td>${req.subtypeName}</td>
      <td>${allocationCell}</td>
      <td>${actionCell}</td>
    `;
    tbody.appendChild(tr);
  });

  tableContainer.style.display = "block";
  exportExcelBtn.style.display = "inline-flex"; // เปิดสิทธิ์ให้กดโหลดแผ่นงาน Excel ออกไปใช้งาน
  emptyState.style.display = "none";
}

// 💾 3. ฟังก์ชันบันทึกมอบหมายตัวแทนรายแถว (ยิงแบบ POST ตรง)
function saveSubstituteRow(rowId) {
  const selectEl = document.getElementById(`select_${rowId}`);
  const selectedSubId = selectEl ? selectEl.value : "";

  if (!selectedSubId) {
    alert("⚠️ กรุณาเลือกรายชื่อบุคลากรผู้ปฏิบัติงานแทนก่อนกดบันทึกครับ");
    return;
  }

  document.getElementById("loadingOverlay").classList.remove("hidden");

  const payload = {
    action: "assignSubstitute",
    rowId: rowId,
    substituteId: selectedSubId,
  };

  fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((response) => {
      document.getElementById("loadingOverlay").classList.add("hidden");
      if (response.status === "success") {
        // โชว์ความสำเร็จผ่านกล่องพรีเมียม Modal
        const successModal = document.getElementById("successModal");
        successModal.style.display = "flex";

        document.getElementById("btnSuccessClose").onclick = () => {
          successModal.style.display = "none";
          fetchSubstituteRequests(); // รีโหลดตารางอัปเดตสถานะทันที แถวที่ทำเสร็จจะหายวับไปเนียน ๆ
        };
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + response.message);
      }
    })
    .catch((err) => {
      document.getElementById("loadingOverlay").classList.add("hidden");
      console.error(err);
      alert("❌ ไม่สามารถบันทึกข้อมูลเข้าสู่ฐานข้อมูลได้");
    });
}

// 📊 4. ไม้ตายลับ: สแกนกวาดตารางหน้าจอแล้ว Export แปลงร่างออกเป็นไฟล์ Excel คลีน ๆ
function exportTableToExcel() {
  const table = document.getElementById("substituteTable");

  // โคลนโครงสร้างตารางชั่วคราวเพื่อคัดแต่งฟอร์แมต Dropdown ก่อนแปลงไฟล์ ป้องกันค่าซีเล็คเตอร์เพี้ยน
  const tableClone = table.cloneNode(true);

  // วนลูปแก้ปัญหาค่าว่างในช่อง Dropdown ตอนแปลงแผ่นงาน
  table.querySelectorAll("select").forEach((select, idx) => {
    const cloneSelect = tableClone.querySelectorAll("select")[idx];
    if (cloneSelect) {
      const selectedText = select.options[select.selectedIndex]?.text || "-";
      cloneSelect.parentNode.innerText = selectedText; // พ่นเป็นเท็กซ์ธรรมดาแทนแท็ก Dropdown ลง Excel
    }
  });

  // ใช้ความสามารถของ SheetJS คลุมและสกัดตารางออกเป็น Workbook
  const wb = XLSX.utils.table_to_book(tableClone, {
    sheet: "รายชื่อผู้ปฏิบัติงานแทน",
  });

  // ตั้งชื่อไฟล์ตามวันเวลาปัจจุบันให้เนี๊ยบๆ
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `ตารางรายชื่อบุคลากรเข้าสอนแทน_${dateStr}.xlsx`);
}

function toggleLoading(show) {
  const spinner = document.getElementById("loadingSpinner");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

  if (show) {
    spinner.style.display = "block";
    tableContainer.style.display = "none";
    emptyState.style.display = "none";
  } else {
    spinner.style.display = "none";
  }
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
