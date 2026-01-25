<%@Language="VBScript" CODEPAGE=65001 %>

<% Option Explicit %>
<% session.CodePage = "65001" %>
<% Response.CharSet = "UTF-8" %>
<% Response.codepage="65001" %>
<% Response.ContentType="application/json;charset=utf-8"%>
<% Response.buffer=true %>
<% Response.Expires = 0 %>

<%	
	'/* 발신프로필 / 예약 API 사용시 여기서부터 삭제후 이용 하시기 바랍니다. */

	'/*
	' * 친구톡 발송 API
	' * username : directsend 발급 ID
	' * key : directsend 발급 api key
	' * kakao_plus_id : directsend에 등록한 @검색용아이디
	' * kakao_friend_type : 친구톡 종류 (텍스트/이미지)
	' * user_template_no : directsend에 등록한 템플릿 번호
	' * receiver : 발송 할 고객 수신자 정보
	' *   json array. ex) 
	' *		[
	' *			{"name": "홍길동", "mobile":"01000000001", "note1":"다이렉트센드 1", "note2":"다이렉트센드 2", "note3":"다이렉트센드 3", "note4":"다이렉트센드 4", "note5":"다이렉트센드 5"}
	' *			, {"name": "홍길동2", "mobile":"01000000002", "note1":"다이렉트센드 2", "note2":"다이렉트센드 3", "note3":"다이렉트센드 4", "note4":"다이렉트센드 5", "note5":"다이렉트센드 6"}
	' *		]
	' * address_books : 사이트에 등록한 발송 할 주소록 번호 , 로 구분함 (ex. 0,1,2)
	' * duplicate_yn : 수신자 정보가 중복될 경우 중복발송을 할지에 대한 여부
	' * template_ad : (광고)삽입 여부
	' * template_title : 템플릿 제목 (한/영 띄어쓰기 포함 15자)
	' * template_body : 템플릿 내용 (한/영 띄어쓰기 포함 1000자, 친구톡-이미지  한/영 띄어쓰기 포함 400자), 변수 문자열 사용 가능
	' *   변수 문자열 : #{이름} - 이름, #{휴대폰} - 휴대폰, #{비고1} - 비고1, #{비고2} - 비고2, #{비고3} - 비고3, #{비고4} - 비고4, #{비고5} - 비고5
	' * template_buttons : 템플릿 버튼
	' *   json array [{"linkType":"WL","name":"버튼명","linkM":"모바일링크","linkP":"PC 링크","linkI"=>"IOS 링크","linkA":"안드로이드 링크"},{"linkType":"AL","name":"버튼명","linkM":"모바일링크","linkP":"PC 링크","linkI":"IOS 링크","linkA":"안드로이드 링크"}]
	' *   linkType : 웹링크(WL) / 앱링크(AL) / 봇키워드(BK) / 메시지전달(MD)
	' *     linkType 웹링크(WL)인 경우 모바일 링크, PC 링크 필수 입력(http:// 포함 작성)
	' *     linkType 앱링크(AL)인 경우 IOS Appstore 등록 링크, Android Googleplaystore등록된 링크 필수 입력(http:// 포함 작성)
	' * template_img_attach : 친구톡 이미지 URL(영문) (jpg, png 파일만 가능, 파일 500kb 제한, 사이즈 720px * 720px, 800px *400px)
	' * template_img_link : 친구톡 이미지 링크 URL(영문) (http://를 포함하여 작성)
	' * return_url : 실제 발송결과를 return 받을 URL 번호
    ' *
    ' * 대체문자 발송시 사용
    ' * kakao_faild_type : 대체문자 종류
    ' * title : 대체문자 MMS/LMS 발송시에 사용하는 제목 (최대 40byte)
    ' * message  : 받을 대체문자 내용 (최대 2000byte), 치환 문자열 사용 가능.
    ' *   치환 문자열 : [$NAME] - 이름 (한글 10글자/영문 30byte 처리), [$MOBILE] - 휴대폰,
    ' *     [$NOTE1] - 비고1 (한글/영문 128자 처리), [$NOTE2] - 비고2 (한글/영문 128자 처리), [$NOTE3] - 비고3 (한글/영문 128자 처리), [$NOTE4] - 비고4 (한글/영문 128자 처리), [$NOTE5] - 비고5 (한글/영문 128자 처리)
    ' * sender : directsend에 등록한 발송 번호
    ' * attaches : 대체문자 MMS URL(영문) (jpg, jpeg 파일만 가능, 파일당 300kb 제한)
	' *
	' * 친구톡과 친구톡 대체문자 발송시 야간 시간대(오후 8시 50분 ~ 다음날 8시)에는 전송할 수 없습니다.
	' * 발신프로필은 directsend.co.kr > 카카오메세지 > 발신프로필등록에서 직접 등록해야하며 비즈니스 채널 개설된 발신프로필만 등록할 수 있습니다.
	' * 템플릿 발송은 directsend.co.kr > 카카오메세지 > 템플릿 등록/관리 > 친구톡에서 직접 등록하여 사용할 수 있습니다.
	' *
	' */

    '/*
    ' * 대체문자 관련 안내사항
    ' *
    ' * 각 번호가 유효하지않을 경우에는 발송이 되지 않습니다.
    ' * 전기통신사업법 84조에 의거 사전 등록 된 발송번호가 없다면 대체문자를 발송할 수 없습니다.
    ' *
    ' * 대체문자 발송시 주말, 연휴 기간에는 문자 인증이 다소 지연될 될 수 있으니 양해 부탁드립니다.
    ' * (광고)대체 문자를 발송시 문자내용앞에 (광고)표시, 하단에 080무료수신거부를 미 기재 후 발송 시, 발송 서비스 이용 제약 및 정보통신망법에 의한 처벌(벌금 3,000만원) 대상입니다.
    ' * 불법 스팸 문자 발송 시 예고없이 서비스 이용이 정지될 수 있으며 이용정지 시 해당 아이디의 주소록과 잔액은 소멸되며, 환불되지 않으니 서비스 이용에 주의를 부탁드립니다.
    ' * 이동통신사의 스팸규제 강화에 따라 스팸차단 서비스가 적용되어 정상 메세지도 스팸으로 분류되어 스팸문자로 보관함에 수신되고 수신자에게 전송 안 된 경우 실제 발송은 성공으로 금액이 차감되는 점 유의 바랍니다.
    ' *
    ' */

	Dim data, httpRequest, postResponse
	Dim username, key, url, kakao_plus_id, user_template_no, kakao_friend_type, receiver, address_books, template_ad, template_title, template_body
	Dim template_buttons, template_img_attach, template_img_link, return_url_yn, return_url, kakao_faild_type, title, message, sender, reserve_type, start_reserve_time, end_reserve_time, remained_count

	'/* 여기서부터 수정해주시기 바랍니다. */

	username = "directsend id"                '필수입력
	key = "directsend 발급 api key"         '필수입력
	kakao_plus_id = "directsend에 등록한 발신프로필 @검색용아이디"            '필수입력
	user_template_no = "directsend에 등록한 템플릿 번호";                '템플릿 번호를 사용하지 않을 경우 주석처리 바랍니다. (하단 294 라인 API 이용하여 확인)

	' 수신자 정보 추가 - 필수 입력(주소록 미사용시), 치환문자 미사용시 치환문자 데이터를 입력하지 않고 사용할수 있습니다.
	' 치환문자 미사용시 {"mobile":"01000000001"} 번호만 입력 해주시기 바랍니다.
	receiver = "{""name"": ""강길동"", ""mobile"":""수신자번호"", ""note1"":""다이렉트센드 1"", ""note2"":""다이렉트센드 2"", ""note3"":""다이렉트센드 3"", ""note4"":""다이렉트센드 4"", ""note5"":""다이렉트센드 5""}"
	receiver = receiver & ",{""name"": ""홍길동"", ""mobile"":"""", ""note1"":""다이렉트센드 2"", ""note2"":""다이렉트센드 3"", ""note3"":""다이렉트센드 4"", ""note4"":""다이렉트센드 5"", ""note5"":""다이렉트센드 6""}"
	receiver = receiver & ",{""name"": ""김길동"", ""mobile"":""수신자번호"", ""note1"":""다이렉트센드 3"", ""note2"":""다이렉트센드 4"", ""note3"":""다이렉트센드 5"", ""note4"":""다이렉트센드 6"", ""note5"":""다이렉트센드 7""}"

	receiver = "["& receiver &"]"

	' 주소록을 사용하길 원하실 경우 아래 주석을 해제하신 후, 사이트에 등록한 주소록 번호를 입력해주시기 바랍니다.
	'address_books = "0,1,2"      '사이트에 등록한 발송 할 주소록 번호 , 로 구분함 (ex. 0,1,2)

	' 수신자 정보가 중복이고 내용이 다를 경우 아래 주석을 해제하시고 발송해주시기 바랍니다.
    'duplicate_yn = "1";

	' 템플릿 정보 추가
	kakao_friend_type = 1      ' 1 : 친구톡(텍스트) / 2 : 친구톡(이미지)
	template_ad = 1       '필수입력 0 : (광고)미표시 / 1 : (광고)표시
	template_title = "친구톡 제목 입니다."
	template_body = "#{이름}님 친구톡 알림 입니다. 전화번호 : #{휴대폰} 메모1 : #{비고1} 메모2 : #{비고2} 메모3 : #{비고3} 메모4 : #{비고4} 메모5 : #{비고5} "

	'버튼 정보 추가 - 웹링크(WL)인 경우 모바일 링크, PC 링크 필수 입력(http:// 포함 작성), 앱링크(AL)인 경우 IOS Appstore 등록 링크, Android Googleplaystore등록된 링크 필수 입력(http:// 포함 작성)
	template_buttons = "{""linkType"":""WL"",""name"":""웹링크"",""linkM"":""https://www.directsend.co.kr"",""linkP"":""https://www.directsend.co.kr"",""linkI"":"""",""linkA"":""""}"
	template_buttons = template_buttons & ",{""linkType"":""AL"",""name"":""앱링크"",""linkM"":"""",""linkP"":"""",""linkI"":""directsend"",""linkA"":""directsend""}"
	template_buttons = template_buttons & ",{""linkType"":""BK"",""name"":""봇키워드"",""linkM"":"""",""linkP"":"""",""linkI"":"""",""linkA"":""""}"
	template_buttons = template_buttons & ",{""linkType"":""MD"",""name"":""메시지전달"",""linkM"":"""",""linkP"":"""",""linkI"":"""",""linkA"":""""}"

	template_buttons = "["& template_buttons &"]"      'json array

	' 친구톡(이미지) 발송시 아래 주석을 해제하고 이미지 파일의 URL을 입력하여 주시기 바랍니다.
	' jpg, png 파일만 가능, 파일 500kb 제한, 사이즈 720px * 720px, 800px *400px 제한 1개만 가능합니다.
	template_img_attach = "https://directsend.co.kr/jpgimg1.jpg"     '친구톡(이미지) 발송시 필수 입력
	template_img_link = "https://www.directsend.co.kr"

	' 대체문자 정보 추가
	kakao_faild_type = "1"'          ' 1 : 대체문자(SMS) / 2 : 대체문자(LMS) / 3 : 대체문자(MMS) 대체문자 사용시 필수 입력
	title = "친구톡 대체문자 SMS 제목입니다."
	message = "[$NAME]님 친구톡 대체 알림 SMS 문자 입니다. 전화번호 : [$MOBILE] 비고1 : [$NOTE1] 비고2 : [$NOTE2] 비고3 : [$NOTE3] 비고4 : [$NOTE4] 비고5 : [$NOTE5]"             '대체문자 사용시 필수입력
	sender = "발송자 번호"                    '대체문자 사용시 필수입력

	' 예약발송 정보 추가
	reserve_type = "ONETIME" ' NORMAL - 즉시발송 / ONETIME - 1회예약 / WEEKLY - 매주정기예약 / MONTHLY - 매월정기예약
	start_reserve_time = "2019-08-23 10:00:00" ' 발송하고자 하는 시간(시,분단위까지만 가능) (동일한 예약 시간으로는 200회 이상 API 호출을 할 수 없습니다.)
	end_reserve_time = "2019-08-23 10:00:00" ' 발송이 끝나는 시간 1회 예약일 경우 start_reserve_time = end_reserve_time
	' WEEKLY | MONTHLY 일 경우에 시작 시간부터 끝나는 시간까지 발송되는 횟수 Ex) type = WEEKLY, start_reserve_time = '2019-08-23 10:00:00', end_reserve_time = '2019-08-30 10:00:00' 이면 remained_count = 2 로 되어야 합니다.
	remained_count = 1
	' 예약 수정/취소 API는 소스 하단을 참고 해주시기 바랍니다.

	' 실제 발송성공실패 여부를 받기 원하실 경우 아래 주석을 해제하신 후, 사이트에 등록한 URL 번호를 입력해 주시기 바랍니다.
	return_url_yn = 1        'return_url 사용시 필수 입력
	return_url = 0

	' 여기까지 수정해주시기 바랍니다. 

	message = Replace(message, " ", " ")  '유니코드 공백문자 치환, 대체문자 발송시 주석 해제

	' 첨부파일이 있을 시 아래 주석을 해제하고 첨부하실 파일의 URL을 입력하여 주시기 바랍니다.
	' jpg파일당 300kb 제한 3개까지 가능합니다.
	Dim attc(2)
	attc(0) = "https://directsend.co.kr/jpgimg1.jpg"
	attc(1) = "https://directsend.co.kr/jpgimg2.jpg"
	attc(2) = "https://directsend.co.kr/jpgimg3.jpg"

	data = """username"":""" & username & """ "
	data = data & ", ""key"":""" & key & """ "
	data = data & ", ""kakao_plus_id"":""" & kakao_plus_id & """ "          '필수입력
	data = data & ", ""user_template_no"":""" & user_template_no & """ "    '템플릿 번호를 사용하지 않을 경우 주석처리 바랍니다.
	data = data & ", ""receiver"":" & receiver            '주소록 사용하지 않는 경우 필수입력, json array 구조
	'data = data & ", ""address_books"":""" & address_books & """ "         '주소록 사용할 경우 주석 해제 바랍니다.
	'data = data & ", ""duplicate_yn"":""" & duplicate_yn & """ "           '중복 발송을 허용할 경우 주석 해제 바랍니다.
	'data = data & ", ""kakao_friend_type"":""" & kakao_friend_type & """ "       '템플릿 번호를 사용하지 않을 경우 필수입력
	'data = data & ", ""template_ad"":""" & template_ad & """ "                   '템플릿 번호를 사용하지 않을 경우 필수입력
	'data = data & ", ""template_title"":""" & template_title & """ "
	'data = data & ", ""template_body"":""" & template_body & """ "               '템플릿 번호를 사용하지 않을 경우 필수입력
	'data = data & ", ""template_buttons"":" & template_buttons        '템플릿 번호를 사용하지 않고 버튼을 추가할 경우 주석 해제하여 사용
	'data = data & ", ""template_img_attach"":""" & template_img_attach & """ " '친구톡 이미지 발송시 주석해제 바랍니다.
	'data = data & ", ""template_img_link"":""" & template_img_link & """ "     '친구톡 이미지 발송시 주석해제 바랍니다.
	'data = data & ", ""kakao_faild_type"":""" & kakao_faild_type & """ " '대체문자 사용시 주석해제 바랍니다.
	'data = data & ", ""title"":""" & title & """ "           '대체문자 사용시 주석해제 바랍니다.
	'data = data & ", ""message"":""" & message & """ "       '대체문자 사용시 주석해제 바랍니다
	'data = data & ", ""sender"":""" & sender & """ "         '대체문자 사용시 주석해제 바랍니다.
	'data = data & ", ""reserve_type"":""" & reserve_type & """ "                ' 예약 관련 정보 사용할 경우 주석 해제 바랍니다.
	'data = data & ", ""start_reserve_time"":""" & start_reserve_time & """ "    ' 예약 관련 정보 사용할 경우 주석 해제 바랍니다.
	'data = data & ", ""end_reserve_time"":""" & end_reserve_time & """ "        ' 예약 관련 정보 사용할 경우 주석 해제 바랍니다.
	'data = data & ", ""remained_count"":""" & remained_count & """ "            ' 예약 관련 정보 사용할 경우 주석 해제 바랍니다.
	'data = data & ", ""return_url_yn"":" & return_url_yn           ' return_url이 있는 경우 주석해제 바랍니다.
	'data = data & ", ""return_url"":""" & return_url & """ "       ' return_url이 있는 경우 주석해제 바랍니다.
	'data = data & ", ""attaches"": """ & attc(0) & "," & attc(1) & "," & attc(2) & """ "   '첨부파일이 있는 경우 첨부파일의 갯수만큼 주석해제 바랍니다.
	data = "{" & data & "}"

	url = "https://directsend.co.kr/index.php/api_v2/kakao_friend"         'URL

	Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")

	httpRequest.Open "POST", url, False
	httpRequest.SetRequestHeader "Content-Type", "application/json"
	httpRequest.Send data		'JSON 데이터

	postResponse = httpRequest.ResponseText

	Response.Write postResponse

	'/*
	'	* response의 실패
	'	* {"status":300, "message":"필수 입력 값이 없습니다."}
	'	* 실패 코드번호, 내용
	'	*
	'	* status code 308 실패인 경우 인코딩 실패 문자열 return
	'	*  {"status":308, "message": "message EUC-KR 인코딩에 실패 하였습니다.\n msg_detail":풰(13)}
	'	*  실패 코드번호, 내용, 인코딩 실패 문자열(문자열 위치)
	'*/

	'/*
	'	* response 성공
	'	* {"status":1}
	'	* 성공 코드번호 (성공코드는 다이렉트센드 DB서버에 정상수신됨을 뜻하며 발송성공(실패)의 결과는 발송완료 이후 확인 가능합니다.)
	'	*
	'	* 잘못된 번호가 포함된 경우
	'	* {"status":1, "message":"유효하지 않는 번호를 제외하고 발송 완료 하였습니다.\n error mobile : 01000000001aa, 010112"}
	'	* 성공 코드번호 (성공코드는 다이렉트센드 DB서버에 정상수신됨을 뜻하며 발송성공(실패)의 결과는 발송완료 이후 확인 가능합니다.), 내용(잘못된 데이터)
	'	*
	'*/

	'/* status code
	'	1   : 정상발송 (성공코드는 다이렉트센드 DB서버에 정상수신됨을 뜻하며 발송성공(실패)의 결과는 발송완료 이후 확인 가능합니다.)
	'	300 : POST validation 실패
	'	301 : receiver 유효한 번호가 아님
	'	302 : api key or user is invalid
	'	303 : 분당 300건 이상 API 호출을 할 수 없습니다.
	'	304 : 대체문자 message validation 실패
	'	305 : 발신 프로필키 유효한 키가 아님
	'	306 : 잔액부족
	'	307 : return_url이 없음
	'	308 : 대체문자 utf-8 인코딩 에러 발생
	'	309 : 대체문자 message length = 0
	'	310 : 대체문자 euckr 인코딩 에러 발생
	'	311 : 대체문자 sender 유효한 번호가 아님
	'	312 : 대체문자 title validation 실패
	'	313 : 카카오 내용 validation 실패
	'	314 : 이미지 갯수 초과
	'	315 : 이미지 확장자 오류
	'	316 : 이미지 업로드 실패
	'	317 : 이미지 용량 300kb 초과
    '	318 : 예약정보가 유효하지 않습니다.
    '	319 : 동일 예약시간으로는 200회 이상 API 호출을 할 수 없습니다.
    '	320 : 친구톡 발송가능한 시간이 아닙니다.
    '	321 : 이미지 사이즈 오류
    '	999 : Internal Error.
	'*/

	'/* 발신프로필 / 예약 API 사용시 여기까 삭제후 이용 하시기 바랍니다. */

	'/* ====================================== 발신 프로필 목록 API 시작 ====================================== */
	'/*
	' * 발신 프로필 목록 조회 API
	' * username : directsend 발급 ID
	' * key : directsend 발급 api key (메일/문자)
	' * profile_type : 조회할 프로필 종류
	' *
	' * 카카오 발송에 필요한 발신 프로필 키를 조회하기 위한 API 입니다.
	' * 발신 프로필 목록을 조회하여 JSON 형식으로 전달 됩니다.
	' * JSON형식 POST값으로 전달 해야 됩니다.
	' * 발신 프로필 목록 API 사용시 주석 해제후 사용 하시기 바랍니다.
	' */

	'Dim data, httpRequest, postResponse
	'Dim username, key, url

	'/* 여기서부터 수정해주시기 바랍니다. */

	'username = "DirectSend id"                '필수입력
	'key = "DirectSend 발급 api key"          '필수입력

	'/* 여기까지 수정해주시기 바랍니다. */

	'data = "{""username"":""" & username & """, ""key"":""" & key & """, ""profile_type"":""1""}"			'JSON 데이터

	'url = "https://directsend.co.kr/index.php/api_kakao/profile/get/list"        'URL

	'Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")
	'httpRequest.Open "POST", url, False
	'httpRequest.SetRequestHeader "Content-Type", "application/json"
	'httpRequest.Send data

	'postResponse = httpRequest.ResponseText
	'Response.Write postResponse


	'/*
	' * response 성공 json 데이터 양식
	' * {result:1, message:"success", data:{~~}}
	' *   data:total_count 프로필 목록 전체 갯수
	' *   data:list[~~]  프로필 목록 정보
	' *      프로필키         senderKey
	' *      @검색용아이디    uuid
	' *      채널 이름      name
	' *      프로필 상태      status
	' *      플러스친구 상태        profileStat
	' *      등록일     cdate
	' *      수정일     udate
	' *      카테고리 코드    catCode
	' *      알림톡 사용 여부       alimUseYn
	' *      휴대폰 번호      kakao_phone
	' *      기본번호설정 여부      default_yn
	' */

	'/*
	' * response 실패 json 데이터 양식
	' * {result:300-1, message:에러 내용}
	' */

	'/*
	'	status code
	'	1 : 성공
	'	300-2 : 파라미터 오류
	'	300-7 : 발신프로필 목록 조회 오류
	' */
	'/* ====================================== 발신 프로필 목록 API 끝 ====================================== */

	'/* ====================================== 템플릿 목록 API 시작 ====================================== */
	'/*
	' * 템플릿 목록 조회 API
	' * username : directsend 발급 ID
	' * key : directsend 발급 api key (메일/문자)
	' *
	' * 카카오 발송에 필요한 템플릿 정보를 조회하기 위한 API 입니다.
	' * 템플릿 목록을 조회하여 JSON 형식으로 전달 됩니다.
	' * JSON형식 POST값으로 전달 해야 됩니다.
	' * 템플릿 목록 API 사용시 주석 해제후 사용 하시기 바랍니다.
	' */

	'Dim data, httpRequest, postResponse
	'Dim username, key, url, template_type

	'/* 여기서부터 수정해주시기 바랍니다. */

	'username = "DirectSend id"                '필수입력
	'key = "DirectSend 발급 api key"           '필수입력

	'/* 여기까지 수정해주시기 바랍니다. */

	'data = "{""username"":""" & username & """, ""key"":""" & key & """, ""template_type"":""4""}"			'JSON 데이터

	'url = "https://directsend.co.kr/index.php/api_kakao/template/get/list"        'URL

	'Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")
	'httpRequest.Open "POST", url, False
	'httpRequest.SetRequestHeader "Content-Type", "application/json"
	'httpRequest.Send data

	'postResponse = httpRequest.ResponseText
	'Response.Write postResponse

	'/*
	' * response 성공 json 데이터 양식
	' * {result:1, message:"success", data:{~~}}
	' *   data:total_count 템플릿 목록 전체 갯수
	' *   data:list[~~]  템플릿 목록 정보
	' *      템플릿 번호	user_template_no
	' *      템플릿 타입	user_template_type
	' *      템플릿 제목	user_template_subject
	' *      템플릿 내용	user_template_content
	' *      @검색용아이디	sms_auth_kakao_plus_id
	' *      등록일	user_template_date
	' *      템플릿 코드	template_code
	' *      템플릿 히스토리	template_comments
	' *      템플릿 버튼	template_buttons
	' *      템플릿 심사상태	template_insp_code
	' *      템플릿 상태	template_status
	' *      템플릿 내용 글자수	template_length
	' *      프로필키	profile_key
	' *      템플릿 이미지	template_images
	' *      템플릿 미리보기	template_preview
	' *      플러스친구 이름	kakao_plus_name
	' *      휴대폰 번호	kakao_phone
	' *      템플릿 광고 여부	template_ad
	' *      템필릿 이미지 링크	template_img_link
	' */

	'/*
	' * response 실패 json 데이터 양식
	' * {result:300-1, message:에러 내용}
	' */

	'/*
	'	status code
	'	1 : 성공
	'	300-2 : 파라미터 오류
	'	300-9 : 템플릿 목록 조회 오류
	' */
	'/* ====================================== 템플릿 목록 API 끝 ====================================== */

	'/* ====================================== 예약 목록 API 시작 ====================================== */
	'/*
	' * 예약 목록 조회 API
	' * username : directsend 발급 ID
	' * key : directsend 발급 api key
	' *
	' * 예약목록 조회 -> 예약 번호 확인 -> 예약 수정/예약 취소 -> 예약 목록 조회(수정정보 확인)
	' * 예약번호, 문자번호등 예약정보를 조회하기 위한 API 입니다.
	' * 예약 목록을 조회하여 JSON 형식으로 전달 됩니다.
	' * JSON형식 POST값으로 전달 해야 됩니다.
	' * 예약 목록 API 사용시 주석 해제후 사용 하시기 바랍니다.
	'*/

	'Dim data, httpRequest, postResponse
	'Dim username, key, url

	'/* 여기서부터 수정해주시기 바랍니다. */
	
	'username = "DirectSend id"              '필수입력
	'key = "DirectSend 발급 api key"           '필수입력

	'/* 여기까지 수정해주시기 바랍니다. */

	'data = "{""username"":""" & username & """, ""key"":""" & key & """, ""kakao_reserve"":""1""}"			'JSON 데이터

	'url = "https://directsend.co.kr/index.php/api_sms_reserve/get"        'URL

	'Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")
	'httpRequest.Open "POST", url, False
	'httpRequest.SetRequestHeader "Content-Type", "application/json"
	'httpRequest.Send data

	'postResponse = httpRequest.ResponseText

	'Response.Write postResponse


	'/*
	' * response 성공 json 데이터 양식
	' * {result:1, message:"success", data:{~~}}
	' *   data:total_count 예약 목록 전체 갯수
	' *   data:list[~~]  예약 목록 정보
	' *      번호	    sms_reserve_no
	' *      발송총횟수	sms_reserve_count
	' *      등록일	    sms_reserve_date
	' *      발송시작일	sms_reserve_startdate
	' *      발송종료일	sms_reserve_enddate
	' *      예약유형	sms_reserve_type       1 : 1회 / 2 : 매주 / 3 : 매달
	' *      발송 총 건수	sms_send_count
	' *      발송자 번호	sms_send_number
	' *      문자 본문	sms_send_body
	' *      인증여부	sms_reserve_auth_flag      0 : 비인증 / 1 : 인증
	' *      문자 번호	sms_no
	' *      MMS 이미지	mms_images
	' *      바이트 수	byte
	' */

	'/*
	' * response 실패 json 데이터 양식
	' * {result:200-1, message:에러 내용}
	' */

	'/*
	'	status code
	'	1 : 성공
	'	200-1 : 파라미터 오류
	'	200-2 : 예약 목록 조회 오류
	' */
	'/* ====================================== 예약 목록 API 끝 ====================================== */

	'/* ====================================== 예약 번호별 정보 조회 API 시작 ====================================== */
	'/*
	' * 예약 번호별 정보 조회 API
	' * username : directsend 발급 ID
	' * key : directsend 발급 api key
    ' * reserve_no : directsend 예약 번호
	' *
	' * 예약번호별 예약정보를 조회하기 위한 API 입니다.
	' * 예약 정보를 조회하여 JSON 형식으로 전달 됩니다.
	' * JSON형식 POST값으로 전달 해야 됩니다.
	' * 예약 번호별 정보 조회 API 사용시 주석 해제후 사용 하시기 바랍니다.
	'*/

	'Dim data, httpRequest, postResponse
	'Dim username, key, reserve_no, url

	'/* 여기서부터 수정해주시기 바랍니다. */

	'username = "DirectSend id"              '필수입력
	'key = "DirectSend 발급 api key"           '필수입력
	'reserve_no = "DirectSend 예약번호"			 '필수입력

	'/* 여기까지 수정해주시기 바랍니다. */

	'data = "{""username"":""" & username & """, ""key"":""" & key & """, ""kakao_reserve"":""1"", ""reserve_no"":""" & reserve_no & """}"			'JSON 데이터

	'url = "https://directsend.co.kr/index.php/api_sms_reserve/get"        'URL

	'Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")
	'httpRequest.Open "POST", url, False
	'httpRequest.SetRequestHeader "Content-Type", "application/json"
	'httpRequest.Send data

	'postResponse = httpRequest.ResponseText

	'Response.Write postResponse


	'/*
	' * response 성공 json 데이터 양식
	' * {result:1, message:"success", data:{~~}}
	' *   data:list[~~]  예약 정보
	' *      번호	    sms_reserve_no
	' *      발송총횟수	sms_reserve_count
	' *      등록일	    sms_reserve_date
	' *      발송시작일	sms_reserve_startdate
	' *      발송종료일	sms_reserve_enddate
	' *      예약유형	sms_reserve_type       1 : 1회 / 2 : 매주 / 3 : 매달
	' *      발송 총 건수	sms_send_count
	' *      발송자 번호	sms_send_number
	' *      문자 본문	sms_send_body
	' *      인증여부	sms_reserve_auth_flag      0 : 비인증 / 1 : 인증
	' *      문자 번호	sms_no
	' *      MMS 이미지	mms_images
	' *      바이트 수	byte
	' */

	'/*
	' * response 실패 json 데이터 양식
	' * {result:200-1, message:에러 내용}
	' */

	'/*
	'	status code
	'	1 : 성공
	'	200-1 : 파라미터 오류
	'	200-2 : 예약 정보 조회 오류
	' */
	'/* ====================================== 예약 번호별 정보 조회 API 끝 ====================================== */

	'/* ====================================== 예약 수정/취소 API 시작 ====================================== */
	'/*
	' * 예약 수정/취소 API
	' * username : directsend 발급 ID
	' * key : directsend 발급 api key
	' * reserve_no : directsend 예약 번호
	' * sms_no : directsend 문자 번호
	' * reserve_type : 예약 유형, 예약 수정 API 사용시 필수 입력
	' * sms_reserve_startdate : 발송하고자 하는 시간(시,분단위까지만 가능), 예약 수정 API 사용시 필수 입력
	' * sms_reserve_enddate : 발송이 끝나는 시간, 예약 수정 API 사용시 필수 입력
	' *
	' * 예약 수정/취소 API에서 사용 하는 예약번호, 문자번호는 예약 목록 API를 통하여 확인하실 수 있습니다.
	' * 예약 목록을 조회하여 예약 수정/취소 정보를 JSON 형식으로 전달 해야 됩니다.
	' * JSON형식 POST값으로 전달 해야 됩니다.
	' * 예약 API 사용시 주석 해제후 사용 하시기 바랍니다.
	'*/

	'Dim data, httpRequest, postResponse
	'Dim username, key, url, reserve_no, sms_no
	'Dim reserve_type, sms_reserve_startdate, sms_reserve_enddate

	'/* 여기서부터 수정해주시기 바랍니다. */

	'username = "DirectSend id"              '필수입력
	'key = "DirectSend 발급 api key"           '필수입력
	'reserve_no = "DirectSend 예약번호"			 '예약 번호 (예약목록 조회 API를 사용하여 확인), 필수입력
	'sms_no = "DirectSend 문자 번호"			 '문자 번호 (예약목록 조회 API를 사용하여 확인), 필수입력

	' 예약 수정 API 사용시 주석해제
	'reserve_type = 1			'//필수입력  1 : 1회 / 2 : 매주 / 3 : 매달
	'sms_reserve_startdate = "2019-04-16 12:00:00"
	'sms_reserve_enddate = "2019-04-16 12:00:00"

	'/* 여기까지 수정해주시기 바랍니다. */

	'data = " ""username"":""" & username & """ "
	'data = data & ", ""key"":""" & key & """ "
	'data = data & ", ""reserve_no"":""" & reserve_no & """ "
	'data = data & ", ""sms_no"":""" & sms_no & """ "

	' 예약 수정 API 사용시 주석해제
	'data = data & ", ""reserve_type"":""" & reserve_type & """ "
	'data = data & ", ""sms_reserve_startdate"":""" & sms_reserve_startdate & """ "
	'data = data & ", ""sms_reserve_enddate"":""" & sms_reserve_enddate & """ "
	'data = "{" & data & "}"		'JSON 데이터


	' 예약 수정 API
	'url = "https://directsend.co.kr/index.php/api_sms_reserve/put"

	' 예약 취소 API 사용시 주석 해제
	'url = "https://directsend.co.kr/index.php/api_sms_reserve/delete"


	'Set httpRequest = Server.CreateObject("MSXML2.ServerXMLHTTP")
	'httpRequest.Open "POST", url, False
	'httpRequest.SetRequestHeader "Content-Type", "application/json"
	'httpRequest.Send data

	'postResponse = httpRequest.ResponseText

	'Response.Write postResponse

	'/*
	' * response 성공 json 데이터 양식
	' * {result:1, message:success}
	' */

	'/*
	' * response 실패 json 데이터 양식
	' * {result:200-1, message:에러 내용}
	' */

	'/*
	'	status code
	'	1 : 성공
	'	200-3 : 예약 정보 오류
	'	200-4 : 예약 수정 처리 오류
	'	200-5 : 예약 취소 처리 오류
	' */
	'/* ====================================== 예약 수정/취소 API 끝 ====================================== */
%>