// --- jsquotaprofiles.js (ฉบับแยกปุ่มและฟอร์มแก้ไขแผนก / โควตาวันลา ออกจากกันเป็นอิสระ) ---

document.addEventListener("DOMContentLoaded", function () {
  const appsScriptUrl =
    "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

  // Elements ของระบบหลัก
  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn");

  // Elements ของพาร์ทค้นหา
  const searchFirstnameInput = document.getElementById("searchFirstname");
  const searchLastnameInput = document.getElementById("searchLastname");
  const btnSearchQuota = document.getElementById("btnSearchQuota");
  const quotaTableBody = document.getElementById("quotaTableBody");

  // Elements ของพาร์ท Modal แก้ไขข้อมูล
  const editQuotaModal = document.getElementById("editQuotaModal");
  const editQuotaForm = document.getElementById("editQuotaForm");
  const editUserId = document.getElementById("editUserId");
  const editActionType = document.getElementById("editActionType"); // คุมประเภทการอัปเดตไปหลังบ้าน
  const modalModeTitle = document.getElementById("modalModeTitle");
  const lblTargetName = document.getElementById("lblTargetName");
  const lblTargetId = document.getElementById("lblTargetId");

  // 🟢 ผูกเพิ่มตัวบล็อกเนื้อหาท่อนบนและท่อนล่างเพื่อสั่งซ่อนสลับกันใช้งาน
  const sectionDepartment = document.getElementById("sectionDepartment");
  const sectionQuota = document.getElementById("sectionQuota");

  const editTypeID = document.getElementById("editTypeID");
  const editSubtypeID = document.getElementById("editSubtypeID");
  const editSickMax = document.getElementById("editSickMax");
  const editPersonalMax = document.getElementById("editPersonalMax");
  const editMaternityMax = document.getElementById("editMaternityMax");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  // Elements ของตัวแจ้งเตือน Modal กลาง
  const statusModal = document.getElementById("statusModal");
  const modalIcon = document.getElementById("modalIcon");
  const modalTitle = document.getElementById("modalTitle");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  const userTypeMap = {
    T001: "คุณครู (Teacher)",
    T002: "ลูกจ้าง (Employee)",
  };

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

  const subtypeOptions = {
    T001: [
      { value: "ST001", text: "บริหารวิชาการ" },
      { value: "ST002", text: "บริหารงบประมาณ" },
      { value: "ST003", text: "บริหารงานบุคคล" },
      { value: "ST004", text: "บริหารทั่วไป" },
      { value: "ST005", text: "บริหารกิจการนักเรียน" },
      { value: "ST006", text: "บริหารงานแผนงาน" },
    ],
    T002: [
      { value: "ST007", text: "ลูกจ้างเหมาบริการ" },
      { value: "ST008", text: "ลูกจ้างประจำ" },
      { value: "ST009", text: "นักศึกษาฝึกสอน" },
    ],
  };

  // 🔒 CHECK SECURITY & RENDER NAVBAR PROFILE
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }
  const currentUser = JSON.parse(storedUser);
  if (userFullNameEl)
    userFullNameEl.textContent = `${currentUser.prename} ${currentUser.firstname} ${currentUser.lastname}`;
  if (userSubtypeEl)
    userSubtypeEl.textContent =
      careerMap[currentUser.subtypeID] || currentUser.subtypeID;

  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("userData");
      window.location.href = "index.html";
    });
  }

  function showModal(text, isSuccess) {
    modalTitle.textContent = text;
    modalIcon.className = "modal-icon " + (isSuccess ? "success" : "error");
    statusModal.classList.remove("hidden");
  }
  modalCloseBtn.addEventListener("click", () =>
    statusModal.classList.add("hidden"),
  );

  function showLoading() {
    if (document.querySelector(".loading-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  function hideLoading() {
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) overlay.remove();
  }

  function updateSubtypeDropdown(selectedType, targetValue = "") {
    editSubtypeID.innerHTML = "";
    const options = subtypeOptions[selectedType] || [];
    options.forEach((opt) => {
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.text;
      if (opt.value === targetValue) el.selected = true;
      editSubtypeID.appendChild(el);
    });
  }

  editTypeID.addEventListener("change", function () {
    updateSubtypeDropdown(this.value);
  });

  // 🔍 SEARCH PROFILE & LEAVE QUOTA SYSTEM
  btnSearchQuota.addEventListener("click", function () {
    const fname = searchFirstnameInput.value.trim();
    const lname = searchLastnameInput.value.trim();

    if (!fname && !lname) {
      showModal(
        "กรุณากรอกชื่อหรือนามสกุลอย่างน้อย 1 ช่องเพื่อใช้ในการค้นหาครับ",
        false,
      );
      return;
    }

    showLoading();

    fetch(
      `${appsScriptUrl}?action=searchQuotaProfiles&firstname=${encodeURIComponent(fname)}&lastname=${encodeURIComponent(lname)}`,
    )
      .then((response) => response.json())
      .then((res) => {
        hideLoading();
        quotaTableBody.innerHTML = "";

        if (res.status === "success" && res.data.length > 0) {
          res.data.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.prename}</td>
                <td>${item.firstname} ${item.lastname}</td>
                <td>${userTypeMap[item.typeID] || item.typeID}</td>
                <td>${careerMap[item.subtypeID] || item.subtypeID}</td>
                <td style="font-weight:600; color:#b91c1c;">${item.sick_max}</td>
                <td>${item.sick_used}</td>
                <td style="font-weight:600; color:#b45309;">${item.personal_max}</td>
                <td>${item.personal_used}</td>
                <td style="font-weight:600; color:#047857;">${item.maternity_max}</td>
                <td>${item.maternity_used}</td>
                <td style="color:#4b5563;">${item.official_used}</td>
                <td>
                  <button class="btn-edit-dept" data-id="${item.userID}" style="padding: 5px 10px; background-color: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">
                      <i class="bi bi-person-badge"></i> แก้ไขแผนก
                  </button>
                  <button class="btn-edit-quota" data-id="${item.userID}" style="padding: 5px 10px; background-color: #e11d48; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      <i class="bi bi-calendar-check"></i> แก้ไขโควต้า
                  </button>
                </td>
            `;
            quotaTableBody.appendChild(tr);
          });

          // เรียกใช้ตัวผูกเหตุการณ์ปุ่มกดแบบแยกล็อค
          bindSplitEditButtons(res.data);
        } else {
          quotaTableBody.innerHTML = `
              <tr>
                  <td colspan="12" style="text-align: center; color: #ef4444; padding: 30px;">
                      <i class="bi bi-exclamation-triangle"></i> ไม่พบข้อมูลบุคลากรที่ตรงกับเงื่อนไขการค้นหา
                  </td>
              </tr>
          `;
        }
      })
      .catch((err) => {
        hideLoading();
        console.error("Search Quota Error:", err);
        showModal("การเชื่อมต่อระบบเซิร์ฟเวอร์ขัดข้อง", false);
      });
  });

  // 🛠️ 🟢 ฟังก์ชันผูกปุ่มแยกส่วน 2 ประเภท (สลักเปิด-ปิดหน้าตาเนื้อหาภายในฟอร์ม)
  function bindSplitEditButtons(dataList) {
    // 1. จัดการฝั่งปุ่มกดแก้ไขแผนกสายงาน
    document.querySelectorAll(".btn-edit-dept").forEach((btn) => {
      btn.addEventListener("click", function () {
        const targetId = this.getAttribute("data-id");
        const targetData = dataList.find((x) => x.userID === targetId);

        if (targetData) {
          setupCommonModalInfo(targetData);

          editActionType.value = "updateUserDepartmentOnly"; // ตั้งเป้าหมายแอคชันไปหลังบ้าน
          modalModeTitle.textContent = "ปรับปรุงฝ่ายแผนกโครงสร้างบุคลากร";

          // สั่งสับสวิตช์: เปิดส่วนที่ 1 ซ่อนส่วนที่ 2
          sectionDepartment.style.display = "block";
          sectionQuota.style.display = "none";

          // ปิดฟิลด์ฝั่งโควตาออกไม่ให้ทำการ Validate ตอนส่งค่า
          editSickMax.required = false;
          editPersonalMax.required = false;
          editMaternityMax.required = false;

          editQuotaModal.classList.remove("hidden");
        }
      });
    });

    // 2. จัดการฝั่งปุ่มกดแก้ไขโควตาวันลา
    document.querySelectorAll(".btn-edit-quota").forEach((btn) => {
      btn.addEventListener("click", function () {
        const targetId = this.getAttribute("data-id");
        const targetData = dataList.find((x) => x.userID === targetId);

        if (targetData) {
          setupCommonModalInfo(targetData);

          editActionType.value = "updateLeaveQuotaOnly"; // ตั้งเป้าหมายแอคชันไปหลังบ้าน
          modalModeTitle.textContent = "ปรับปรุงสิทธิ์โควตาวันลาสูงสุด (Max)";

          // สั่งสับสวิตช์: ซ่อนส่วนที่ 1 เปิดส่วนที่ 2
          sectionDepartment.style.display = "none";
          sectionQuota.style.display = "block";

          // บังคับการกรอกข้อมูลวันลาให้ครบถ้วน
          editSickMax.required = true;
          editPersonalMax.required = true;
          editMaternityMax.required = true;

          editQuotaModal.classList.remove("hidden");
        }
      });
    });
  }

  // ฟังก์ชันตัวกลางสำหรับเติมค่าสแตนดาร์ดใส่ฟอร์ม
  function setupCommonModalInfo(targetData) {
    editUserId.value = targetData.userID;
    lblTargetId.textContent = targetData.userID;
    lblTargetName.textContent = `${targetData.prename} ${targetData.firstname} ${targetData.lastname}`;

    editTypeID.value = targetData.typeID;
    updateSubtypeDropdown(targetData.typeID, targetData.subtypeID);

    editSickMax.value = targetData.sick_max;
    editPersonalMax.value = targetData.personal_max;
    editMaternityMax.value = targetData.maternity_max;
  }

  btnCancelEdit.addEventListener("click", () =>
    editQuotaModal.classList.add("hidden"),
  );

  // 📥 SUBMIT FORM UPDATE (ฉบับเปลี่ยนตัวแปร Action ยิงตามโหมดปุ่มกด)
  editQuotaForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const updateData = {
      action: editActionType.value, // 🟢 ยิงแยกคีย์ตามโหมด: updateUserDepartmentOnly หรือ updateLeaveQuotaOnly
      UserID: editUserId.value,
      TypeID: editTypeID.value,
      SubtypeID: editSubtypeID.value,
      SickMax: parseInt(editSickMax.value) || 0,
      PersonalMax: parseInt(editPersonalMax.value) || 0,
      MaternityMax: parseInt(editMaternityMax.value) || 0,
    };

    showLoading();

    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify(updateData),
    })
      .then((response) => response.json())
      .then((res) => {
        hideLoading();
        if (res.status === "success") {
          editQuotaModal.classList.add("hidden");
          showModal(res.message, true);
          btnSearchQuota.click(); // รีเฟรชตารางโชว์ค่าใหม่ล่าสุดทันที
        } else {
          showModal("ไม่สามารถบันทึกได้: " + res.message, false);
        }
      })
      .catch((err) => {
        hideLoading();
        console.error("Update Profile Error:", err);
        showModal("ระบบเชื่อมต่อขัดข้อง ไม่สามารถอัปเดตข้อมูลได้", false);
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
