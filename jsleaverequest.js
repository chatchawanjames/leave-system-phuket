// --- jsleaverequest.js (ฉบับสมบูรณ์: บล็อกวันย้อนหลัง + ดักโควตา + Spinner บังจอตอนเริ่มโหลด) ---

document.addEventListener("DOMContentLoaded", function () {
  // 🟢 URL หลังบ้าน Google Apps Script ของพี่เจมส์
  const appsScriptUrl =
    "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn");

  const leaveRequestForm = document.getElementById("leaveRequestForm");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const totalDaysInput = document.getElementById("totalDays");

  const statusModal = document.getElementById("statusModal");
  const modalIcon = document.getElementById("modalIcon");
  const modalTitle = document.getElementById("modalTitle");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

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
  };

  // ==========================================
  // ⏳ ฟังก์ชันเปิด-ปิด Spinner โหลดข้อมูล (ย้ายขึ้นมาด้านบนเพื่อให้เรียกใช้ง่าย)
  // ==========================================
  function showLoadingOverlay() {
    if (document.querySelector(".loading-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }

  function hideLoadingOverlay() {
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) overlay.remove();
  }

  // ==========================================
  // 🛡️ ระบบล็อกวันล่วงหน้า ดักไม่ให้คุณครูจิ้มเลือกวันในอดีตย้อนหลัง
  // ==========================================
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];
  if (startDateInput) startDateInput.setAttribute("min", formattedToday);
  if (endDateInput) endDateInput.setAttribute("min", formattedToday);

  function showModal(text, isSuccess) {
    modalTitle.textContent = text;
    modalIcon.className = "modal-icon " + (isSuccess ? "success" : "error");
    statusModal.classList.remove("hidden");

    const card = statusModal.querySelector(".modal-card");
    if (card) {
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
    }
  }

  modalCloseBtn.addEventListener("click", () => {
    statusModal.classList.add("hidden");
  });

  // 🔒 ระบบความปลอดภัยดักกรองสิทธิ์เบื้องต้น
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(storedUser);

  // พ่นชื่อโปรไฟล์ขึ้นหัวเว็บ
  if (userFullNameEl)
    userFullNameEl.textContent = `${user.prename} ${user.firstname} ${user.lastname}`;
  if (userSubtypeEl)
    userSubtypeEl.textContent = careerMap[user.subtypeID] || user.subtypeID;

  // ระบบ Sign Out ล้างท่อความปลอดภัย
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("userData");
      window.location.href = "index.html";
    });
  }

  // ==========================================
  // ⚡ 📥 ระบบดึงสิทธิ์โควตาคงเหลือมาฝังลงหน้าจอ (เพิ่มม่านหมุนบังตอนโหลดครั้งแรก)
  // ==========================================
  let userActiveQuota = {
    sick_remain: 0,
    personal_remain: 0,
    maternity_remain: 0,
  };

  function loadCurrentQuotaFromServer() {
    // 🟢 1. สั่งเปิดตัวหมุน Spinner ทันทีที่เริ่มดึงข้อมูลข้ามฟ้าเพื่อความเนี๊ยบตามสั่งพี่เจมส์
    showLoadingOverlay();

    fetch(`${appsScriptUrl}?action=getUserLeaveQuota&userID=${user.userID}`)
      .then((response) => response.json())
      .then((res) => {
        // 🟢 2. พอหลังบ้านตอบกลับมาปุ๊บ สั่งปิดม่านหมุนทันที
        hideLoadingOverlay();

        if (res.status === "success") {
          userActiveQuota.sick_remain = Number(res.data.sick_remain);
          userActiveQuota.personal_remain = Number(res.data.personal_remain);
          userActiveQuota.maternity_remain = Number(res.data.maternity_remain);

          // console.log("📊 โควตาโหลดสำเร็จนิ่งในสคริปต์:", userActiveQuota);

          // พ่นตัวเลขลงบนก้อนการ์ดใน HTML
          if (document.getElementById("displaySickRemain"))
            document.getElementById("displaySickRemain").textContent =
              res.data.sick_remain;
          if (document.getElementById("displaySickMax"))
            document.getElementById("displaySickMax").textContent =
              res.data.sick_max;

          if (document.getElementById("displayPersonalRemain"))
            document.getElementById("displayPersonalRemain").textContent =
              res.data.personal_remain;
          if (document.getElementById("displayPersonalMax"))
            document.getElementById("displayPersonalMax").textContent =
              res.data.personal_max;

          if (document.getElementById("displayMaternityRemain"))
            document.getElementById("displayMaternityRemain").textContent =
              res.data.maternity_remain;
          if (document.getElementById("displayMaternityMax"))
            document.getElementById("displayMaternityMax").textContent =
              res.data.maternity_max;

          if (document.getElementById("displayOfficialUsed"))
            document.getElementById("displayOfficialUsed").textContent =
              res.data.official_used;
        }
      })
      .catch((err) => {
        // 🟢 3. ดักกรณีเน็ตหลุดหรือ Server ขัดข้อง ก็ต้องปิดม่านหมุนด้วย หน้าจอจะได้ไม่ค้างล็อก
        hideLoadingOverlay();
        console.error("Error background loading quota:", err);
      });
  }
  loadCurrentQuotaFromServer(); // ดึงมาพ่นตั้งแต่เริ่มเปิดหน้าจอ

  // ==========================================
  // ⏳ ฟังก์ชันคำนวณจำนวนวันลาอัตโนมัติสดๆ หน้าจอ (End - Start + 1)
  // ==========================================
  function calculateTotalDays() {
    const startVal = startDateInput.value;
    const endVal = endDateInput.value;

    if (startVal && endVal) {
      const start = new Date(startVal);
      const end = new Date(endVal);

      if (end < start) {
        totalDaysInput.value = "";
        showModal("TXT001", false); // ใช้แสดงม่านเตือนตามปกติ
        showModal(
          "วันที่สิ้นสุดการลา ต้องไม่ต่ำกว่าวันที่เริ่มต้นลาครับ",
          false,
        );
        endDateInput.value = "";
        return 0;
      }

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      totalDaysInput.value = diffDays;
      return diffDays;
    } else {
      totalDaysInput.value = "";
      return 0;
    }
  }

  startDateInput.addEventListener("change", calculateTotalDays);
  endDateInput.addEventListener("change", calculateTotalDays);

  // ==========================================
  // 📥 EVENT SUBMIT FORM (พาร์ทเชื่อมต่อยิงถล่มเซิร์ฟเวอร์จริง)
  // ==========================================
  leaveRequestForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const totalDays = calculateTotalDays();
    if (totalDays <= 0) return;

    const leaveTypeValue = document.getElementById("leaveType").value;

    // ม่านพลัง If-Else ดักวันลาเกินสิทธิ์ก่อนยิง
    if (
      leaveTypeValue === "ลาป่วย" &&
      totalDays > userActiveQuota.sick_remain
    ) {
      showModal(
        `ไม่สามารถลาได้: วันลาป่วยคงเหลือของคุณคือ ${userActiveQuota.sick_remain} วัน แต่คุณระบุลา ${totalDays} วัน`,
        false,
      );
      return;
    }
    if (
      leaveTypeValue === "ลากิจ" &&
      totalDays > userActiveQuota.personal_remain
    ) {
      showModal(
        `ไม่สามารถลาได้: วันลากิจคงเหลือของคุณคือ ${userActiveQuota.personal_remain} วัน แต่คุณระบุลา ${totalDays} วัน`,
        false,
      );
      return;
    }
    if (
      leaveTypeValue === "ลาคลอด" &&
      totalDays > userActiveQuota.maternity_remain
    ) {
      showModal(
        `ไม่สามารถลาได้: วันลาคลอดคงเหลือของคุณคือ ${userActiveQuota.maternity_remain} วัน แต่คุณระบุลา ${totalDays} วัน`,
        false,
      );
      return;
    }

    const formData = {
      action: "createLeaveRequest",
      UserID: user.userID,
      TypeID: user.typeID,
      SubtypeID: user.subtypeID,
      LeaveType: leaveTypeValue,
      Reason: document.getElementById("reason").value.trim(),
      StartDate: startDateInput.value,
      EndDate: endDateInput.value,
      TotalDays: totalDays,
      HasSubstitute: document.getElementById("hasSubstitute").value,
    };

    showLoadingOverlay();

    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((res) => {
        hideLoadingOverlay();
        if (res.status === "success") {
          showModal("ส่งคำขอลางานสำเร็จ!", true);
          leaveRequestForm.reset();
          totalDaysInput.value = "";

          // รีเฟรชโหลดแต้มคงเหลือดักไว้ใช้งานรอบใหม่และอัปเดตหน้าจอไปในตัว (มีสปินเนอร์ครอบจังหวะนี้ด้วย)
          loadCurrentQuotaFromServer();

          if (startDateInput)
            startDateInput.setAttribute("min", formattedToday);
          if (endDateInput) endDateInput.setAttribute("min", formattedToday);
        } else {
          showModal("เกิดข้อผิดพลาด: " + res.message, false);
        }
      })
      .catch((err) => {
        hideLoadingOverlay();
        console.error("Fetch Submit Error:", err);
        showModal("ระบบเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูลขัดข้อง", false);
      });
  });
});

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
