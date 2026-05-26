// --- jsusermanagement.js (เวอร์ชันเปลี่ยนป๊อปอัปคอมเฟิร์มลบเป็น Modal เด้งสวยงาม คลีน 100%) ---

document.addEventListener("DOMContentLoaded", function () {
  const appsScriptUrl =
    "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn");

  const userTableBody = document.getElementById("userTableBody");
  const refreshBtn = document.getElementById("refreshBtn");

  // Elements ของระบบแก้ไขข้อมูล
  const editUserModal = document.getElementById("editUserModal");
  const editUserForm = document.getElementById("editUserForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const deleteUserBtn = document.getElementById("deleteUserBtn");

  // Elements ของระบบยืนยันการลบข้อมูล (Modal ตัวใหม่ที่เพิ่มมา)
  const confirmDeleteModal = document.getElementById("confirmDeleteModal");
  const confirmDeleteText = document.getElementById("confirmDeleteText");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const submitDeleteBtn = document.getElementById("submitDeleteBtn");

  // Elements ของระบบแสดงสถานะสำเร็จ/ล้มเหลว
  const statusModal = document.getElementById("statusModal");
  const modalIcon = document.getElementById("modalIcon");
  const modalTitle = document.getElementById("modalTitle");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  let onModalCloseCallback = null;
  let loadingOverlay = null;

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

  function showLoading() {
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    loadingOverlay.appendChild(spinner);
    document.body.appendChild(loadingOverlay);
  }

  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.remove();
      loadingOverlay = null;
    }
  }

  function showModal(text, isSuccess, callback) {
    modalTitle.textContent = text;
    modalIcon.className = "modal-icon " + (isSuccess ? "success" : "error");
    onModalCloseCallback = callback;
    statusModal.classList.remove("hidden");
  }

  modalCloseBtn.addEventListener("click", () => {
    statusModal.classList.add("hidden");
    if (typeof onModalCloseCallback === "function") {
      onModalCloseCallback();
    }
  });

  // เช็กความปลอดภัยเบื้องต้น
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(storedUser);
  if (userFullNameEl)
    userFullNameEl.textContent = `${user.prename} ${user.firstname} ${user.lastname}`;
  if (userSubtypeEl)
    userSubtypeEl.textContent = careerMap[user.subtypeID] || user.subtypeID;

  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("userData");
      window.location.href = "index.html";
    });
  }

  // ==========================================
  // 📊 ฟังก์ชันโหลดข้อมูลแสดงผลในตาราง
  // ==========================================
  function loadUserData() {
    userTableBody.innerHTML = `<tr><td colspan="10" class="text-center">NowLoading ...</td></tr>`;

    fetch(appsScriptUrl)
      .then((response) => response.json())
      .then((res) => {
        if (res.status === "success") {
          const users = res.data;
          if (users.length === 0) {
            userTableBody.innerHTML = `<tr><td colspan="10" class="text-center">ไม่พบข้อมูลรายชื่อบุคลากรในระบบ</td></tr>`;
            return;
          }

          let tableHtml = "";
          users.forEach((row) => {
            const typeThai = careerMap[row[7]] || row[7];
            const subtypeThai = careerMap[row[8]] || row[8];
            const safeRowJson = encodeURIComponent(JSON.stringify(row));

            tableHtml += `
                        <tr>
                            <td>${row[1] || "-"}</td>
                            <td>${row[2] || "-"}</td>
                            <td>${row[3] || "-"}</td>
                            <td>${row[4] || "-"}</td>
                            <td>${row[5] || "-"}</td>
                            <td>${typeThai}</td>
                            <td>${subtypeThai}</td>
                            <td>${row[10] || "-"}</td>
                            <td>${row[9] || "-"}</td>
                            <td>
                                <button class="btn-edit" onclick="openEditModal('${safeRowJson}')">
                                    <i class="bi bi-pencil-square"></i> แก้ไข
                                </button>
                            </td>
                        </tr>
                    `;
          });
          userTableBody.innerHTML = tableHtml;
        } else {
          userTableBody.innerHTML = `<tr><td colspan="10" class="text-center" style="color: red;">เกิดข้อผิดพลาด: ${res.message}</td></tr>`;
        }
      })
      .catch((error) => {
        console.error("Fetch Error:", error);
        userTableBody.innerHTML = `<tr><td colspan="10" class="text-center" style="color: red;">ไม่สามารถเชื่อมต่อข้อมูล Google Sheet ได้</td></tr>`;
      });
  }

  // 🛠️ ฟังก์ชันเปิดใช้งานป๊อปอัปฟอร์มแก้ไขข้อมูล
  window.openEditModal = function (encodedRowData) {
    const rowData = JSON.parse(decodeURIComponent(encodedRowData));
    document.getElementById("editUserID").value = rowData[0];
    document.getElementById("editUserDisplay").textContent =
      `รหัส: ${rowData[0]} | ชื่อ: ${rowData[1]}${rowData[2]} ${rowData[3]}`;
    document.getElementById("editStatus").value = rowData[9];
    document.getElementById("editRole").value = rowData[10];
    editUserModal.classList.remove("hidden");
  };

  cancelEditBtn.addEventListener("click", () =>
    editUserModal.classList.add("hidden"),
  );

  // 💾 ระบบกดยิงส่งค่าอัปเดตกลับไปบันทึกที่ Google Sheet
  editUserForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const updateData = {
      action: "updateUser",
      UserID: document.getElementById("editUserID").value,
      Status: document.getElementById("editStatus").value,
      Role: document.getElementById("editRole").value,
    };

    showLoading();
    fetch(appsScriptUrl, { method: "POST", body: JSON.stringify(updateData) })
      .then((response) => response.json())
      .then((res) => {
        hideLoading();
        editUserModal.classList.add("hidden");
        if (res.status === "success") {
          showModal("อัปเดตข้อมูลสำเร็จ", true, () => loadUserData());
        } else {
          showModal("เกิดข้อผิดพลาด: " + res.message, false, null);
        }
      })
      .catch((err) => {
        hideLoading();
        showModal("การเชื่อมต่อขัดข้อง ไม่สามารถอัปเดตข้อมูลได้", false, null);
      });
  });

  // ==========================================
  // 🗑️ ระบบลบข้อมูลบุคลากรแบบ MODAL สวยงามตามบรีฟ
  // ==========================================

  // เมื่อกดปุ่มถังขยะแดงในหน้าต่างแก้ไขหลัก
  if (deleteUserBtn) {
    deleteUserBtn.addEventListener("click", function () {
      const displayInfo =
        document.getElementById("editUserDisplay").textContent;

      // สลักคำพูดคลีนๆ ลงในตัวแปรกางโชว์บนหน้า Modal
      confirmDeleteText.textContent = `คุณแน่ใจใช่ไหมว่าต้องการจะลบข้อมูลของบุคลากรท่านนี้?\n(${displayInfo})`;

      editUserModal.classList.add("hidden"); // ซ่อนหน้าต่างแก้ไขหลักก่อน
      confirmDeleteModal.classList.remove("hidden"); // กางหน้าต่างคอนเฟิร์มลบขึ้นมาแทน
    });
  }

  // กรณีกดปุ่ม "ยกเลิก" ในหน้าคอนเฟิร์มลบ ให้เด้งหน้าต่างแก้ไขหลักกลับมา
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", function () {
      confirmDeleteModal.classList.add("hidden");
      editUserModal.classList.remove("hidden");
    });
  }

  // กรณีกดปุ่ม "ใช่, ต้องการลบ" (Yes) ส่งค่ายิงถล่มกูเกิลชีทข้ามฟ้า
  if (submitDeleteBtn) {
    submitDeleteBtn.addEventListener("click", function () {
      const userID = document.getElementById("editUserID").value;

      confirmDeleteModal.classList.add("hidden"); // ปิดหน้าต่างคอนเฟิร์ม
      showLoading(); // หมุนตัวโหลดรอ

      const deleteData = {
        action: "deleteUser",
        UserID: userID,
      };

      fetch(appsScriptUrl, {
        method: "POST",
        body: JSON.stringify(deleteData),
      })
        .then((response) => response.json())
        .then((res) => {
          hideLoading();
          if (res.status === "success") {
            showModal("ลบข้อมูลบุคลากรออกจากระบบสำเร็จแล้ว", true, () =>
              loadUserData(),
            );
          } else {
            showModal("เกิดข้อผิดพลาด: " + res.message, false, () => {
              editUserModal.classList.remove("hidden"); // ถ้าพลาดให้เปิดหน้าแก้ไขกลับคืนมา
            });
          }
        })
        .catch((err) => {
          hideLoading();
          console.error("Delete error:", err);
          showModal("การเชื่อมต่อขัดข้อง ไม่สามารถลบข้อมูลได้", false, () => {
            editUserModal.classList.remove("hidden");
          });
        });
    });
  }

  loadUserData();

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      loadUserData();
    });
  }
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
