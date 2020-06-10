// console.log(token);

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// 바이트 사이즈 표기 변환
function sizeConvert(size) {
  const KB = (size / 1000).toFixed(1);
  const MB = (KB / 1000).toFixed(1);
  const GB = (MB / 1000).toFixed(1);

  if (GB >= 1) {
    return GB + "GB";
  } else if (MB >= 1) {
    return MB + "MB";
  } else {
    return KB + "KB";
  }
}

// 날짜 표기 변환
function dateConvert(date) {
  const year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hours = date.getHours();
  var minutes = date.getMinutes();

  month = month >= 10 ? month : "0" + month;
  day = day >= 10 ? day : "0" + day;
  hours = hours >= 10 ? hours : "0" + hours;
  minutes = minutes >= 10 ? minutes : "0" + minutes;

  const result = `${year}-${month}-${day} ${
    hours > 12 ? `오후 ${hours - 12}` : `오전 ${hours}`
  }:${minutes}`;

  return result;
}

// 로그아웃
$(".logout").click(() => {
  location.href = "../../account/logout";
});

// 파일 업로드 버튼 클릭시
$(".upload-btn").click(() => {
  $(".upload-input").click();
});

// 파일 업로드
$(".upload-input").change((event) => {
  file = event.target.files[0];
  var formData = new FormData();
  //   var csrf_token = getCookie("csrftoken");
  //   console.log(csrf_token);
  //   formData.append("csrfmiddlewaretoken", csrf_token);
  //   formData.append("testfield", "80");
  formData.append("file", event.target.files[0]);
  console.log(file);
  const name = file.name;
  const size = file.size;
  const date = file.lastModifiedDate;

  $.ajax({
    url: "../test",
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    success: () => {
      const convertedSize = sizeConvert(size);
      const convertedDate = dateConvert(date);

      const tableRowIcon = document.createElement("i");
      const tableRowName = document.createElement("div");
      const tableRowDate = document.createElement("div");
      const tableRowSize = document.createElement("div");
      const tableRowOwner = document.createElement("div");
      const tableRowItem = document.createElement("li");

      tableRowName.innerText = name;
      tableRowDate.innerText = convertedDate;
      tableRowSize.innerText = convertedSize;

      tableRowIcon.classList.add("far");
      tableRowIcon.classList.add("fa-file");
      tableRowIcon.classList.add("file-icon");
      tableRowName.classList.add("table-row-name");
      tableRowDate.classList.add("table-row-date");
      tableRowSize.classList.add("table-row-size");
      tableRowItem.classList.add("table-row-item");

      tableRowItem.appendChild(tableRowIcon);
      tableRowItem.appendChild(tableRowName);
      tableRowItem.appendChild(tableRowDate);
      tableRowItem.appendChild(tableRowSize);

      $(".table-rows").append(tableRowItem);
    },
    error: () => {
      $(".load-modal-content").text("업로드 실패");
      $(".load-modal-btn").text("확인");
      $(".load-modal").removeClass("hidden");
      $(".load-modal").click(() => {
        $(".load-modal").addClass("hidden");
      });
    },
  });
});

// 폴더 추가
$(".newfolder-btn").click(() => {
  $(".add-folder-modal").removeClass("hidden");
  $(".btn-cancel").click(() => {
    $(".btn-add-folder").off("click");
    $(".add-folder-input").val("");
    $(".add-folder-modal").addClass("hidden");
  });

  $(".btn-add-folder").click(() => {
    $(".btn-add-folder").off("click");
    $(".add-folder-modal").addClass("hidden");

    var folderName;
    if ($(".add-folder-input").val() === "") {
      folderName = "새 폴더";
    } else {
      folderName = $(".add-folder-input").val();
    }
    $(".add-folder-input").val("");
    const currentFolderKey = "1234"; // 현재 폴더 키 넣어주기

    const folderData = {
      folderName: folderName,
      cuurentFolderKey: currentFolderKey,
    };
    $.ajax({
      url: "../test", // URL 다시 설정하기
      dataType: "json",
      type: "POST",
      data: folderData,
      success: () => {
        const date = new Date();
        const convertedDate = dateConvert(date);

        const tableRowIcon = document.createElement("i");
        const tableRowName = document.createElement("div");
        const tableRowDate = document.createElement("div");
        const tableRowSize = document.createElement("div");
        const tableRowOwner = document.createElement("div");
        const tableRowItem = document.createElement("li");

        tableRowName.innerText = folderName;
        tableRowDate.innerText = convertedDate;
        tableRowSize.innerText = "-";

        tableRowIcon.classList.add("far");
        tableRowIcon.classList.add("fa-folder");
        tableRowIcon.classList.add("file-icon");
        tableRowName.classList.add("table-row-name");
        tableRowDate.classList.add("table-row-date");
        tableRowSize.classList.add("table-row-size");
        tableRowItem.classList.add("table-row-item");

        tableRowItem.appendChild(tableRowIcon);
        tableRowItem.appendChild(tableRowName);
        tableRowItem.appendChild(tableRowDate);
        tableRowItem.appendChild(tableRowSize);

        $(".table-rows").append(tableRowItem);
        $(".add-folder-modal").addClass("hidden");
      },
      error: () => {
        $(".load-modal-content").text("폴더 생성 실패");
        $(".load-modal-btn").text("확인");
        $(".load-modal").removeClass("hidden");
        $(".load-modal").click(() => {
          $(".load-modal").addClass("hidden");
        });
      },
    });
  });
});
