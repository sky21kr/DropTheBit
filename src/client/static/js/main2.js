// rootFolderId 루트 폴더 아이디
var pathStack = []; // 현재 경로
var currentItemId; //현재 선택된 아이템 id
var currentItemType; // 현재 선택된 아이템 타입
var currentItemName; // 현재 선택한 파일 이름
var currentFolderId; // 현재 폴더 id
var currentFolderContents = {}; // 현재 폴더 안 내용들
var folderIdStack = []; // 폴더 id 스택
var currentType; // 내 파일, 공유 파일, 검색 파일
// 아이템 타입
const FILE = "FILE";
const FOLDER = "FOLDER";
const MYFILE = "MYFILE";
const SHAREDFILE = "SHAREDFILE";
const SEARCHFILE = "SHEARCHFILE";

// csrf 토큰
function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != "") {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

var csrftoken = getCookie("csrftoken");

// 처음 기본 세팅
function defaultSetting() {
  pathStack = [];
  folderIdStack = [];
  pathStack.push("root");
  folderIdStack.push(rootFolderId);
  currentItemId = "";
  currentFolderId = rootFolderId;
  currentFolderContents = {
    folders: [],
    files: [],
  };
  currentType = MYFILE;
  currentItemName = "";
  getCapacity();
}

// 용량 구하기
function getCapacity() {
  $.ajax({
    url: "../../capacity",
    success: function (data) {
      var currentVolume = (30 - data.left_capacity / 1024 / 1024).toFixed(2);
      //   var left_capacity = 30 - (31457171.123046875 / 1024 / 1024).toFixed(2);

      $(".menu-volumne").text(`${currentVolume}GB / 30.00GB`);
    },
    error: () => {
      onesideModalInfoChange("용량 계산 실패");
    },
  });
}

// 경로 그리기
function paintPath() {
  var currentPath = "";
  for (folderName of pathStack) {
    currentPath = currentPath + " > " + folderName;
  }
  $(".route").text(currentPath);
}

// 파일, 폴더 창 비우기
function clear() {
  $(".table-rows").children().remove();
}

// 파일 그리기
function paintFile(fileName, fileDate, fileSize, fileOwner) {
  const tableRowIcon = document.createElement("i");
  const tableRowName = document.createElement("div");
  const tableRowDate = document.createElement("div");
  const tableRowSize = document.createElement("div");
  const tableRowOwner = document.createElement("div");
  const tableRowItem = document.createElement("li");

  fileSize = sizeConvert(fileSize);
  fileDate = dateConvert(fileDate);

  tableRowName.innerText = fileName;
  tableRowDate.innerText = fileDate;
  tableRowSize.innerText = fileSize;
  tableRowOwner.innerText = fileOwner;

  tableRowIcon.classList.add("far");
  tableRowIcon.classList.add("fa-file");
  tableRowIcon.classList.add("file-icon");
  tableRowName.classList.add("table-row-name");
  tableRowDate.classList.add("table-row-date");
  tableRowSize.classList.add("table-row-size");
  tableRowOwner.classList.add("table-row-owner");
  tableRowItem.classList.add("table-row-item");

  tableRowItem.appendChild(tableRowIcon);
  tableRowItem.appendChild(tableRowName);
  tableRowItem.appendChild(tableRowDate);
  tableRowItem.appendChild(tableRowSize);
  tableRowItem.appendChild(tableRowOwner);

  addCheckedEvent(tableRowItem); // 파일 체크 이벤트 추가
  addContextMenuEvent(tableRowItem);

  $(".table-rows").append(tableRowItem);
}

// 폴더 그리기
function paintFolder(folderName, folderDate = "", folderOwner) {
  const tableRowIcon = document.createElement("i");
  const tableRowName = document.createElement("div");
  const tableRowDate = document.createElement("div");
  const tableRowSize = document.createElement("div");
  const tableRowOwner = document.createElement("div");
  const tableRowItem = document.createElement("li");

  tableRowName.innerText = folderName;
  tableRowDate.innerText = folderDate;
  tableRowSize.innerText = "";
  tableRowOwner.innerText = folderOwner;

  tableRowIcon.classList.add("far");
  tableRowIcon.classList.add("fa-folder");
  tableRowIcon.classList.add("file-icon");
  tableRowName.classList.add("table-row-name");
  tableRowDate.classList.add("table-row-date");
  tableRowSize.classList.add("table-row-size");
  tableRowOwner.classList.add("table-row-owner");
  tableRowItem.classList.add("table-row-item");

  tableRowItem.appendChild(tableRowIcon);
  tableRowItem.appendChild(tableRowName);
  tableRowItem.appendChild(tableRowDate);
  tableRowItem.appendChild(tableRowSize);
  tableRowItem.appendChild(tableRowOwner);

  addCheckedEvent(tableRowItem);
  addContextMenuEvent(tableRowItem);
  addMoveFolderEvent(tableRowItem);

  $(".table-rows").append(tableRowItem);
}

// 바이트 사이즈 표기 변환
function sizeConvert(size) {
  return size.toLocaleString() + "KB";
}

// 날짜 표기 변환
function dateConvert(date) {
  const year = date.slice(0, 4);
  const month = date.slice(5, 7);
  const day = date.slice(8, 10);
  const hour = Number(date.slice(11, 13));
  const minute = date.slice(14, 16);

  return `${year}-${month}-${day} ${
    hour > 12 ? `오후 ${hour - 12}` : `오전 ${hour}`
  }:${minute}`;
}

// 버튼 클릭 체크 이벤트 추가, 선택 이벤트
function addCheckedEvent(target) {
  // 우클릭, 좌클릭 포함
  $(target).on("mousedown", () => {
    targetName = $(target).children(".table-row-name").text();
    // 폴더면
    if ($(target).children(".table-row-size").text() === "") {
      for (folder of currentFolderContents.folders) {
        if (folder.name === targetName) {
          currentItemId = folder.id;
          currentItemType = FOLDER;
          currentItemName = targetName;
          break;
        }
      }
    } else {
      // 파일이면
      for (file of currentFolderContents.files) {
        if (file.name === targetName) {
          currentItemId = file.id;
          currentItemType = FILE;
          currentItemName = targetName;
          break;
        }
      }
    }
    console.log(targetName);
    if ($(target).hasClass("clicked") !== true) {
      $(".table-row-item").removeClass("clicked");
      $(target).addClass("clicked");
    }
  });
}

// 우클릭 메뉴 이벤트 추가
function addContextMenuEvent(target) {
  currentFile = target;
  //Show contextmenu:
  $(target).contextmenu(function (e) {
    // 하나만 체크됐는지 확인
    if ($(target).hasClass("clicked") !== true) {
      $(".table-row-item").removeClass("clicked");
      $(target).addClass("clicked");
    }

    //Get window size:
    var winWidth = $(document).width();
    var winHeight = $(document).height();
    //Get pointer position:
    var posX = e.pageX;
    var posY = e.pageY;
    //Get contextmenu size:
    var menuWidth = $(".contextmenu").width();
    var menuHeight = $(".contextmenu").height();
    //Security margin:
    var secMargin = 1;
    //Prevent page overflow:
    if (
      posX + menuWidth + secMargin >= winWidth &&
      posY + menuHeight + secMargin >= winHeight
    ) {
      //Case 1: right-bottom overflow:
      posLeft = posX - menuWidth - secMargin + "px";
      posTop = posY - menuHeight - secMargin + "px";
    } else if (posX + menuWidth + secMargin >= winWidth) {
      //Case 2: right overflow:
      posLeft = posX - menuWidth - secMargin + "px";
      posTop = posY + secMargin + "px";
    } else if (posY + menuHeight + secMargin >= winHeight) {
      //Case 3: bottom overflow:
      posLeft = posX + secMargin + "px";
      posTop = posY - menuHeight - secMargin + "px";
    } else {
      //Case 4: default values:
      posLeft = posX + secMargin + "px";
      posTop = posY + secMargin + "px";
    }
    //Display contextmenu:

    $(".folder").hide();
    $(".file").hide();

    if (currentItemType === FOLDER) {
      $(".folder")
        .css({
          left: posLeft,
          top: posTop,
        })
        .show();
    } else {
      $(".file")
        .css({
          left: posLeft,
          top: posTop,
        })
        .show();
    }
    //Prevent browser default contextmenu.
    return false;
  });
  //Hide contextmenu:
  $(document).click(function () {
    $(".contextmenu").hide();
  });
}

// Oneside 모달 정보 수정
function onesideModalInfoChange(content) {
  $(".oneside-modal-content").text(content);
  $(".oneside-modal").removeClass("hidden");
}

// oneside 모달 닫기 눌렀을 때
$(".oneside-modal-btn").click(() => {
  $(".oneside-modal").addClass("hidden");
});

// interactive 모달 정보 수정
function interativeModalInfoChange(content, placeholder, input) {
  $(".interactive-content").text(content);
  $(".interactive-input").attr("placeholder", placeholder);
  $(".interactive-input").val(input);
  $(".interactive-modal").removeClass("hidden");
}

function paintBackFolder() {
  const tableRowIcon = document.createElement("i");
  const tableRowName = document.createElement("div");
  const tableRowDate = document.createElement("div");
  const tableRowSize = document.createElement("div");
  const tableRowOwner = document.createElement("div");
  const tableRowItem = document.createElement("li");

  tableRowName.innerText = "..";
  tableRowDate.innerText = "";
  tableRowSize.innerText = "";
  tableRowOwner.innerText = "";

  tableRowIcon.classList.add("far");
  tableRowIcon.classList.add("fa-folder");
  tableRowIcon.classList.add("file-icon");
  tableRowName.classList.add("table-row-name");
  tableRowDate.classList.add("table-row-date");
  tableRowSize.classList.add("table-row-size");
  tableRowOwner.classList.add("table-row-owner");
  tableRowItem.classList.add("table-row-item");

  tableRowItem.appendChild(tableRowIcon);
  tableRowItem.appendChild(tableRowName);
  tableRowItem.appendChild(tableRowDate);
  tableRowItem.appendChild(tableRowSize);
  tableRowItem.appendChild(tableRowOwner);

  addCheckedEvent(tableRowItem);
  addBackEvent(tableRowItem);

  $(".table-rows").append(tableRowItem);
  $(".table-rows").attr("oncontextmenu", "return false");
}

// 폴더 뒤로가기
function addBackEvent(target) {
  $(target).dblclick(() => {
    folderIdStack.pop();
    pathStack.pop();
    getFolderContents(folderIdStack.pop());
  });
}

function paintFolderContents(folderContents) {
  if (folderIdStack.length !== 0) {
    paintBackFolder();
  }
  for (folder of folderContents.folders) {
    paintFolder(folder.name, folder.date, folder.owner);
  }
  for (file of folderContents.files) {
    paintFile(file.name, file.date, file.size, file.owner);
  }
}

// 폴더 새로고침
function reload() {
  folderIdStack.pop();
  getFolderContents(currentFolderId);
}

// 폴더 안 내용 가져오기 & 그리기
function getFolderContents(folderId) {
  clear();
  $.ajax({
    url: `../../list/${folderId}`, // URL 다시 설정하기
    async: false,
    success: function (data) {
      if (folderIdStack.length !== 1) {
        paintBackFolder();
      }
      for (folder of data.folders) {
        paintFolder(folder.name, folder.date, folder.owner);
      }
      for (file of data.files) {
        paintFile(file.name, file.date, file.size, file.owner);
      }

      folderIdStack.push(folderId);

      for (folder of currentFolderContents.folders) {
        if (folder.id === folderId) {
          pathStack.push(folder.name);
          break;
        }
      }
      paintPath();
      currentFolderContents = data;
      currentFolderId = folderId;
    },
    error: () => {
      onesideModalInfoChange("List 불러오기 실패");
    },
  });
}

// 폴더 이동 이벤트 추가
function addMoveFolderEvent(target) {
  $(target).dblclick(() => {
    moveCurrentFolder(currentItemId);
  });
}

// 폴더 이동
function moveCurrentFolder(folderId) {
  getFolderContents(folderId);
}

// 파일 검색 시
function search(searchKeyword) {
  clear();
  $(".route").text("> 검색 결과");
  $.ajax({
    url: `../../search/${searchKeyword}`,
    type: "GET",
    success: (data) => {
      currentType = SEARCHFILE;
      currentFolderContents = data;
      for (file of data.files) {
        paintFile(file.name, file.date, file.size, file.owner);
      }
    },
    error: () => {
      onesideModalInfoChange("파일 검색 실패");
    },
  });
}

// 인잇
function init() {
  defaultSetting();
  getFolderContents(rootFolderId); // 처음 폴더 목록 불러오기
  paintPath();
}

// Interactive 모달 닫기 눌렀을 때
$(".btn-cancel").click(() => {
  $(".btn-ok").off("click");
  $(".interactive-input").val("");
  $(".interactive-modal").addClass("hidden");
});

// share 모달 닫기 눌렀을 때
$(".btn-share-cancel").click(() => {
  $(".btn-share-ok").off("click");
  $(".file-share-input").val("");
  $(".file-share-modal").addClass("hidden");
});

// 로그아웃
$(".logout").click(() => {
  location.href = "../../account/logout";
});

// 파일 업로드 버튼 클릭시
$(".upload-btn").click(() => {
  if (currentType == SHAREDFILE) {
    onesideModalInfoChange("공유 폴더는 폴더 추가가 불가능합니다");
    return;
  } else if (currentType == SEARCHFILE) {
    onesideModalInfoChange("검색 결과창은 폴더 추가가 불가능합니다");
    return;
  }
  $(".upload-input").click();
});

// 파일 업로드
$(".upload-input").change((event) => {
  if (currentType == SHAREDFILE) {
    onesideModalInfoChange("공유 폴더는 폴더 추가가 불가능합니다");
    return;
  } else if (currentType == SEARCHFILE) {
    onesideModalInfoChange("검색 결과창은 폴더 추가가 불가능합니다");
    return;
  }
  file = event.target.files[0];
  var formData = new FormData();
  formData.append("file", event.target.files[0]);
  const name = file.name;

  for (file of currentFolderContents.files) {
    if (file.name === name) {
      onesideModalInfoChange("동일한 파일이 존재합니다");
      return;
    }
  }
  $(".upload-bits").css("animation", "fadein 1s forwards");

  $.ajax({
    url: `../../upload/${currentFolderId}`,
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    success: (data) => {
      $(".upload-bits").css("animation", "fadeout 1s forwards");

      reload();
      getCapacity();
      onesideModalInfoChange("업로드 완료");
    },
    error: () => {
      $(".upload-bits").css("animation", "fadeout 1s forwards");

      onesideModalInfoChange("업로드 실패");
    },
  });
});

// 폴더 추가
$(".newfolder-btn").click(() => {
  if (currentType == SHAREDFILE) {
    onesideModalInfoChange("공유 폴더는 폴더 추가가 불가능합니다");
    return;
  } else if (currentType == SEARCHFILE) {
    onesideModalInfoChange("검색 결과창은 폴더 추가가 불가능합니다");
    return;
  }
  interativeModalInfoChange("새 폴더", "새 폴더", "");

  $(".btn-ok").click(() => {
    $(".btn-ok").off("click");
    $(".interactive-modal").addClass("hidden");

    var folderName;
    if ($(".interactive-input").val() === "") {
      folderName = "새 폴더";
    } else {
      folderName = $(".interactive-input").val();
    }
    $(".interactive-input").val("");
    const currentFolderKey = currentFolderId; // 현재 폴더 키 넣어주기

    const folderData = {
      folderName: folderName,
      currentFolderKey: currentFolderKey,
    };
    $.ajax({
      url: "../../folderAdd", // URL 다시 설정하기
      type: "POST",
      data: folderData,
      success: () => {
        reload();
        $(".interactive-modal").addClass("hidden");
      },
      error: () => {
        onesideModalInfoChange("폴더 생성 실패");
      },
    });
  });
});

// 파일 다운로드
$(".contextmenu-download").click(() => {
  $(".download-bits").css("animation", "fadein 1s forwards");

  $.ajax({
    url: `../../file/${currentItemId}/download`, // URL 다시 설정하기
    type: "POST",
    success: () => {
      $(".download-bits").css("animation", "fadeout 1s forwards");
    },
    error: () => {
      $(".download-bits").css("animation", "fadeout 1s forwards");

      onesideModalInfoChange("다운로드 실패");
    },
  });
});

// 파일 공유
$(".contextmenu-share").click(() => {
  $(".file-share-modal").removeClass("hidden");

  $(".btn-share-ok").click(() => {
    $(".btn-share-ok").off("click");
    $(".file-share-modal").addClass("hidden");
    var userName = $(".file-share-input").val();
    var mode = $(":radio[name=file-share-mode]:checked").val();
    var data = {
      user: userName,
      mode: mode,
    };
    $.ajax({
      url: `../../file/${currentItemId}/share`, // URL 다시 설정하기
      data: data, // 공유할 파일 id
      type: "POST",
      success: () => {
        onesideModalInfoChange("파일 공유 성공");
      },
      error: () => {
        onesideModalInfoChange("파일 공유 실패");
      },
    });
  });
});

// 파일 & 폴더 이름 변경
$(".contextmenu-namechange").click(() => {
  if (currentItemType === FOLDER) {
    interativeModalInfoChange("폴더 이름", "", "");

    $(".btn-ok").click(() => {
      $(".btn-ok").off("click");
      $(".interactive-modal").addClass("hidden");

      const newName = $(".interactive-input").val();

      $.ajax({
        url: `../../folder/${currentItemId}/rename`, // URL 다시 설정하기
        type: "POST",
        data: { new_name: newName },
        success: () => {
          if (currentType == SHAREDFILE) {
            getSharedFile();
          } else if (currentType == SEARCHFILE) {
            var searchKeyword = $(".input-search").val();
            search(searchKeyword);
          } else {
            reload();
          }
        },
        error: () => {
          onesideModalInfoChange("이름 변경 실패");
        },
      });
    });
  } else {
    interativeModalInfoChange("파일 이름", "", "");

    $(".btn-ok").click(() => {
      $(".btn-ok").off("click");
      $(".interactive-modal").addClass("hidden");

      const newName = $(".interactive-input").val();

      $.ajax({
        url: `../../file/${currentItemId}/rename`, // URL 다시 설정하기
        type: "POST",
        data: { new_name: newName },
        success: () => {
          if (currentType == SHAREDFILE) {
            getSharedFile();
          } else if (currentType == SEARCHFILE) {
            var searchKeyword = $(".input-search").val();
            search(searchKeyword);
          } else {
            reload();
          }
        },
        error: () => {
          onesideModalInfoChange("쓰기 권한이 없습니다");
        },
      });
    });
  }
});

// 폴더 및 파일 삭제
$(".contextmenu-delete").click(() => {
  if (currentItemType === FOLDER) {
    $.ajax({
      url: `../../folder/${currentItemId}`, // URL 다시 설정하기
      type: "DELETE",
      success: (data) => {
        if (currentType == SHAREDFILE) {
          getSharedFile();
        } else if (currentType == SEARCHFILE) {
          var searchKeyword = $(".input-search").val();
          search(searchKeyword);
        } else {
          reload();
        }
        if (data.result === "success") {
          getCapacity();
          onesideModalInfoChange("폴더 삭제 성공");
        } else {
          onesideModalInfoChange("폴더 삭제 권한이 없습니다");
        }
      },
      error: () => {
        onesideModalInfoChange("폴더 삭제 실패");
      },
    });
  } else {
    $.ajax({
      url: `../../file/${currentItemId}`, // URL 다시 설정하기
      type: "DELETE",
      success: (data) => {
        if (currentType == SHAREDFILE) {
          getSharedFile();
        } else if (currentType == SEARCHFILE) {
          var searchKeyword = $(".input-search").val();
          search(searchKeyword);
        } else {
          reload();
        }
        if (data.result === "success") {
          getCapacity();
          onesideModalInfoChange("파일 삭제 성공");
        } else {
          onesideModalInfoChange("파일 삭제 권한이 없습니다");
        }
      },
      error: () => {
        onesideModalInfoChange("파일 삭제 실패");
      },
    });
  }
});

// 내 파일 클릭 시
$(".menu-myfile").click(() => {
  clear();
  defaultSetting();
  getFolderContents(rootFolderId);
});

function getSharedFile() {
  clear();
  $.ajax({
    url: "../../shared",
    success: (data) => {
      currentFolderContents = data;
      for (file of data.files) {
        paintFile(file.name, file.date, file.size, file.owner);
      }
    },
    error: () => {},
  });
}
// 공유 파일 클릭 시
$(".menu-sharefile").click(() => {
  currentType = SHAREDFILE;
  $(".route").text("> 공유파일");
  getSharedFile();
});

// 클릭으로 파일 검색
$(".fa-search").click(() => {
  var searchKeyword = $(".input-search").val();
  search(searchKeyword);
});

// 엔터키로 파일 검색
$(".input-search").keydown(function (key) {
  if (key.keyCode == 13) {
    var searchKeyword = $(".input-search").val();
    search(searchKeyword);
  }
});

// 파일 공유 취소
$(".contextmenu-sharedel").click(() => {
  $.ajax({
    url: `../../file/${currentItemId}/share_del`,
    success: () => {
      if (currentType == SHAREDFILE) {
        getSharedFile();
      } else if (currentType == SEARCHFILE) {
        var searchKeyword = $(".input-search").val();
        search(searchKeyword);
      } else {
        reload();
      }
      onesideModalInfoChange("공유 취소 성공");
    },
    error: () => {
      onesideModalInfoChange("공유 취소 실패");
    },
  });
});

// 파일 복사
$(".contextmenu-copy").click(() => {
  $(".upload-bits").css("animation", "fadein 1s forwards");
  $.ajax({
    url: `../../copy/${currentItemId}`,
    success: (data) => {
      $(".upload-bits").css("animation", "fadeout 1s forwards");

      getCapacity();

      if (currentType == SHAREDFILE) {
        getSharedFile();
      } else if (currentType == SEARCHFILE) {
        var searchKeyword = $(".input-search").val();
        search(searchKeyword);
      } else {
        reload();
      }
      onesideModalInfoChange("파일 복사 완료");
    },
    error: () => {
      onesideModalInfoChange("파일 복사 실패");
    },
  });
});

init();
