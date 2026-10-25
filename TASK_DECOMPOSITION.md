# HW1 - Accessible Data-Grid: Task Decomposition

## 1. Phạm vi và trạng thái

- Repository: https://github.com/Bo-hwi/lab02-web-application
- Branch mục tiêu: `hw1/data-grid`.
- Bài tập: HW1 - Production Enterprise Data-Grid (WCAG 2.2 AA), trang 30 của slide Lab 02.
- Trạng thái: lập kế hoạch; chưa xác nhận hoàn thành các tác vụ triển khai hoặc kiểm thử.
- Công nghệ: HTML, CSS và JavaScript thuần; dùng ES Modules và API trình duyệt.
- Kế thừa code hữu ích từ repo; không bắt buộc hoàn thành Sprint 2-3 hay xây thêm framework.
- Phạm vi branch này chỉ gồm HW1. HW2 và HW3 được thực hiện trên các branch riêng.
- Hình thức nộp: push source code và tài liệu lên branch trên GitHub.

## 2. Yêu cầu nghiệm thu từ slide

| ID | Yêu cầu | Bằng chứng cần có |
|---|---|---|
| R01 | Bảng có sorting, filtering và pagination | Test logic và thao tác trên trình duyệt |
| R02 | Đáp ứng WCAG 2.2 AA; yêu cầu tương phản 4.5:1; hỗ trợ trình đọc màn hình | Kiểm tra tương phản, bàn phím, screen reader và các tiêu chí AA áp dụng |
| R03 | Phím mũi tên di chuyển giữa ô; Enter chọn; Space bật/tắt | Kịch bản kiểm thử bàn phím và trạng thái chọn |
| R04 | Dùng table, thead, tbody, th scope="col" và button; tránh div-soup | Kiểm tra DOM thực tế |
| R05 | Có ngữ nghĩa ARIA grid, row, gridcell phù hợp | Kiểm tra accessibility tree và screen reader |
| R06 | Lighthouse Accessibility 100/100 và Best Practices 100/100 | Báo cáo đo thật trên bản cuối cùng |
| R07 | Cấu hình cột có header, accessorKey, sortable; grid có data, columns, ariaLabel và callback onRowSelect tùy chọn | Contract và kiểm thử cấu hình |

Các yêu cầu quy trình chung: chia nhỏ tác vụ, xác định contract trước khi triển khai, kiểm chứng độc lập, cập nhật project-rules.md và ghi commit rõ ràng.

Không mặc định yêu cầu virtual scrolling, backend, tài khoản đăng nhập, CRUD sản phẩm, React, JSX hoặc một engine reconciliation hoàn chỉnh. Mốc tối thiểu 8 commit được ghi ở HW3, không được coi là tiêu chí số lượng của HW1.

## 3. Lựa chọn triển khai cho phần đề chưa quy định

Các lựa chọn sau là thiết kế của bài làm, không phải yêu cầu bổ sung của giảng viên:

- Dùng khoảng 100 sản phẩm mẫu cố định, lưu trong repo; không phụ thuộc API bên ngoài.
- Các cột: mã sản phẩm, tên sản phẩm, danh mục, giá và tồn kho; có cột chọn dòng.
- Dữ liệu gồm ID duy nhất, chuỗi tiếng Việt, giá trị số, giá trị bằng nhau và tồn kho bằng 0 để kiểm thử.
- Tìm theo mã/tên, lọc theo danh mục; kết hợp các điều kiện lọc.
- Sắp xếp một cột tại một thời điểm; lần kích hoạt tiếp theo đổi tăng/giảm.
- Giá và tồn kho được so sánh theo số gốc, không theo chuỗi đã định dạng.
- Mặc định 10 dòng/trang; cho phép chọn 10, 20 hoặc 50 dòng/trang.
- Enter chọn dòng đang chứa ô focus; Space bật/tắt chọn dòng đó.
- Lựa chọn được lưu theo ID và giữ khi đổi trang, lọc hoặc sắp xếp.
- Có hướng dẫn bàn phím hiển thị trên trang; checkbox biểu đạt trạng thái chọn dòng.
- Chỉ ô hoạt động thuộc thứ tự Tab của vùng dữ liệu; dùng phím mũi tên để di chuyển trong vùng đó.
- Các nút sắp xếp, bộ lọc và nút phân trang vẫn sử dụng được bằng bàn phím theo hành vi phù hợp của điều khiển native.
- Di chuyển bằng mũi tên dừng ở biên trang hiện tại, không tự chuyển trang.
- Hợp đồng dữ liệu được mô tả bằng JSDoc/Markdown; mã chạy trên trình duyệt là JavaScript.
- Chạy bằng máy chủ HTTP tĩnh để hỗ trợ ES Modules; README phải ghi cách chạy đã kiểm chứng.

## 4. Cấu trúc dự kiến

```text
index.html
mini-react.js                 # Code nền; tái sử dụng hoặc sửa khi cần
css/
  base.css
  data-grid.css
js/
  data/products.js
  grid/
    model.js
    view.js
    keyboard.js
    main.js
tests/
  grid-tests.html
  grid-tests.js
docs/
  contracts/data-grid.md
  verification/HW1_VERIFICATION.md
  evidence/
README.md
project-rules.md
TASK_DECOMPOSITION.md
AI_FAILURE_AUDIT.md
```

Giữ các file kiểm thử nền hiện có trừ khi việc di chuyển có mục đích rõ ràng và đã sửa, kiểm tra lại đường dẫn import. Chỉ tạo images/ nếu bài thực sự dùng ảnh; bảng sản phẩm không bắt buộc có ảnh.

## 5. Quy trình cho từng tác vụ

1. Đọc yêu cầu và xác định đầu vào, đầu ra, điều kiện đúng.
2. Chỉ triển khai tác vụ hiện tại; không yêu cầu AI sinh toàn bộ ứng dụng một lượt.
3. Kiểm thử đúng phạm vi thay đổi và kiểm tra tích hợp liên quan.
4. Xem git diff và git status; chỉ stage các file thuộc tác vụ.
5. Tạo commit có ý nghĩa sau khi kiểm tra đạt.
6. Ghi bằng chứng, mã commit và đánh dấu hoàn thành trong tài liệu này.

Thông điệp commit bên dưới là dự kiến. Không tạo commit rỗng, không tạo lịch sử giả và không đánh dấu đạt nếu chưa chạy kiểm tra.

## 6. Danh sách công việc theo thứ tự

### T01 - Xác nhận code nền và cập nhật phạm vi tài liệu

- [ ] Xác nhận đang ở hw1/data-grid và ghi commit nền thực tế.
- [ ] Đọc code, tài liệu và kiểm thử sẵn có; chạy lại những kiểm thử có thể chạy.
- [ ] Ghi rõ kiểm thử chưa chạy hoặc đang lỗi, không suy ra kết quả từ báo cáo cũ.
- [ ] Lưu nội dung WBS Exercise 1 cũ trong docs/ trước khi thay bằng WBS homework nếu cần bảo tồn tài liệu tại branch.
- [ ] Cập nhật project-rules.md từ phạm vi Exercise 1 sang HW1; giữ quy tắc an toàn và kiểm chứng còn phù hợp.
- [ ] Thêm tài liệu phân rã công việc này.

Hoàn thành khi: phạm vi và trạng thái nền có bằng chứng; không vô tình đưa HW2/HW3 vào branch.

Commit: `docs(hw1): define data-grid scope and task decomposition`

### T02 - Định nghĩa contract và các điều kiện luôn phải đúng

- [ ] Mô tả Product, ColumnDef, GridOptions và GridState trong docs/contracts/data-grid.md.
- [ ] Xác định state tối thiểu: điều kiện lọc, cột/chiều sort, trang, kích thước trang, tập ID đã chọn và ô hoạt động.
- [ ] Quy định chuỗi xử lý: dữ liệu gốc -> lọc -> sắp xếp -> phân trang.
- [ ] Xác định hành vi Enter, Space, mũi tên và Tab; phân biệt focus với selection.
- [ ] Xác định xử lý dữ liệu rỗng, trang vượt giới hạn, ID không hợp lệ và ô focus bị loại do lọc.
- [ ] Quy định không mutate dữ liệu gốc; giữ ID ổn định; số đếm và trạng thái ARIA phải khớp dữ liệu đang hiển thị.

Hoàn thành khi: các hành vi có thể chuyển thành test cụ thể, không còn mâu thuẫn giữa thao tác bàn phím và lựa chọn dòng.

Commit: `docs(grid): define data and interaction contracts`

### T03 - Chuẩn bị dữ liệu mẫu

- [ ] Tạo khoảng 100 sản phẩm cố định với ID duy nhất.
- [ ] Có nhiều danh mục, tên tiếng Việt, giá trùng nhau và tồn kho bằng 0.
- [ ] Kiểm tra kiểu dữ liệu, ID trùng và giá trị không hợp lệ.

Hoàn thành khi: dữ liệu đủ nhiều trang và tái hiện được cùng một kết quả giữa các lần chạy.

Commit: `feat(grid): add deterministic product fixtures`

### T04 - Dựng bảng semantic và cấu trúc giao diện

- [ ] Tạo index.html với tiêu đề, vùng điều khiển, bảng, thông báo và phân trang.
- [ ] Render cột theo cấu hình; dùng table, thead, tbody, th scope="col" và button.
- [ ] Có tên truy cập cho bảng; xác định role cho grid, row, columnheader và gridcell đúng vị trí.
- [ ] Có label cho input/select; nội dung text được render qua DOM API an toàn.
- [ ] Giữ trường dữ liệu và hàm xử lý tách khỏi phần dựng giao diện.
- [ ] Kiểm tra render chuỗi giống HTML như văn bản, không tạo phần tử hoặc thực thi mã ngoài ý muốn.

Hoàn thành khi: DOM có cấu trúc đúng, dữ liệu và tiêu đề cột khớp contract, không có lỗi console.

Commit: `feat(grid): render semantic configurable data table`

### T05 - Thiết lập state và sự kiện tập trung

- [ ] Tạo luồng cập nhật state -> tính dữ liệu hiển thị -> cập nhật giao diện.
- [ ] Dùng event delegation cho các sự kiện phù hợp tại root; ánh xạ keydown chính xác.
- [ ] Bảo đảm listener không được thêm lặp lại sau mỗi lần render.
- [ ] Tránh thay toàn bộ root khi đang gõ hoặc thao tác khiến mất focus/vị trí con trỏ.
- [ ] Xác định cơ chế khôi phục focus theo ID dòng và khóa cột nếu phải thay node.

Hoàn thành khi: cập nhật thử nhiều lần không nhân đôi handler, không mất nội dung nhập và không mất focus ngoài dự kiến.

Commit: `feat(grid): add state updates and delegated events`

### T06 - Lọc dữ liệu

- [ ] Tìm theo mã/tên, bỏ khoảng trắng đầu/cuối và không phân biệt hoa/thường.
- [ ] Kết hợp tìm kiếm với lọc danh mục.
- [ ] Khi điều kiện lọc thay đổi, đưa trang về 1.
- [ ] Hiển thị trạng thái không có kết quả và số kết quả khớp.
- [ ] Viết test cho lọc rỗng, từ khóa không có kết quả, tiếng Việt và bộ lọc kết hợp.

Hoàn thành khi: kết quả đúng và dữ liệu gốc không bị thay đổi.

Commit: `feat(grid): implement search and category filtering`

### T07 - Sắp xếp dữ liệu

- [ ] Chỉ cho phép sắp xếp các cột được đánh dấu sortable.
- [ ] Hỗ trợ tăng/giảm, phân biệt so sánh chuỗi và số.
- [ ] Có thứ tự ổn định cho các giá trị bằng nhau; không dùng index làm định danh dòng.
- [ ] Cập nhật aria-sort trên tiêu đề cột tương ứng và biểu thị chiều sort rõ ràng.
- [ ] Kiểm thử số 2/10/100, giá trị bằng nhau, chuỗi tiếng Việt và sort sau lọc.

Hoàn thành khi: sắp xếp toàn bộ kết quả lọc trước phân trang và không mutate mảng dữ liệu gốc.

Commit: `feat(grid): implement stable column sorting`

### T08 - Phân trang

- [ ] Tính số trang và lát dữ liệu từ kết quả lọc/sort.
- [ ] Thêm điều khiển trang trước/sau và chọn kích thước trang.
- [ ] Vô hiệu hóa điều khiển không còn tác dụng; thông báo vị trí trang rõ ràng.
- [ ] Xử lý 0 dòng, một trang, trang cuối chưa đầy và giảm số trang sau lọc.
- [ ] Kiểm tra không có dòng bị lặp hoặc mất khi duyệt lần lượt các trang.

Hoàn thành khi: trang luôn hợp lệ; không xuất hiện thông báo như trang 1/0, số đếm âm hoặc giá trị NaN.

Commit: `feat(grid): implement pagination and page size controls`

### T09 - Lựa chọn dòng theo ID

- [ ] Thêm checkbox có tên truy cập cho từng dòng.
- [ ] Lưu lựa chọn bằng ID, cập nhật checkbox và aria-selected nhất quán.
- [ ] Triển khai callback onRowSelect nếu được cung cấp; ghi rõ trong contract khi callback được gọi.
- [ ] Giữ lựa chọn qua lọc, sort và đổi trang; hiển thị số dòng đã chọn chính xác.
- [ ] Kiểm thử thao tác lặp không gọi callback hoặc bật/tắt hai lần ngoài dự kiến.

Hoàn thành khi: lựa chọn gắn với đúng sản phẩm dù vị trí dòng thay đổi.

Commit: `feat(grid): add persistent row selection by product id`

### T10 - Điều hướng bàn phím và quản lý focus

- [ ] Dùng bốn phím mũi tên di chuyển focus giữa ô; xử lý biên hàng/cột.
- [ ] Enter chọn dòng, Space bật/tắt lựa chọn theo contract.
- [ ] Xử lý đúng khi focus ở checkbox/nút; không kích hoạt hai lần cùng một hành động.
- [ ] Dùng preventDefault có chọn lọc; không chặn việc gõ trong ô tìm kiếm hoặc hành vi native cần thiết.
- [ ] Tab/Shift+Tab vào và ra khỏi grid được, không có keyboard trap.
- [ ] Duy trì hoặc đặt lại focus hợp lý sau lọc, sort và đổi trang.

Hoàn thành khi: có thể sử dụng mọi chức năng bằng bàn phím, không cần chuột và không mất dấu focus.

Commit: `feat(a11y): implement grid keyboard navigation and focus management`

### T11 - Hoàn thiện CSS và phản hồi truy cập được

- [ ] Thêm CSS bố cục, bảng, điều khiển và trạng thái rỗng.
- [ ] Đo tương phản văn bản theo yêu cầu đề; kiểm tra tương phản điều khiển và focus theo tiêu chí áp dụng.
- [ ] Có focus nhìn rõ; không chỉ dùng màu để báo lựa chọn hoặc chiều sort.
- [ ] Kiểm tra viewport hẹp, zoom và kích thước vùng tương tác; bảng có cách cuộn phù hợp khi cần.
- [ ] Dùng thông báo trạng thái phù hợp cho thay đổi số kết quả/trang/lựa chọn; tránh đọc lại toàn bộ bảng liên tục.
- [ ] Kiểm tra mục tiêu có thể bị che khuất khi focus và các tiêu chí WCAG 2.2 AA liên quan.

Hoàn thành khi: giao diện đọc và thao tác được ở các kích thước đã kiểm tra; các trạng thái có thông tin rõ ràng.

Commit: `feat(a11y): improve grid styling and accessible feedback`

### T12 - Kiểm thử tích hợp và hồi quy

- [ ] Chạy test logic bằng công cụ JavaScript sẵn có hoặc test harness thuần; không tự thêm thư viện test.
- [ ] Chạy chuỗi lọc -> sort -> đổi trang -> chọn dòng -> đổi bộ lọc.
- [ ] Kiểm tra dữ liệu rỗng, trang cuối, lựa chọn ngoài kết quả lọc và focus sau thay đổi.
- [ ] Kiểm tra listener không tích lũy và không có lỗi console sau nhiều thao tác.
- [ ] Chạy lại kiểm thử nền có liên quan nếu sửa mini-react.js hoặc mã dùng chung.
- [ ] Ghi kết quả quan sát thực tế trong docs/verification/HW1_VERIFICATION.md.

Hoàn thành khi: test quan trọng đạt, mọi lỗi phát hiện đã được sửa và kiểm tra lại; lỗi chưa sửa phải được ghi rõ.

Commit: `test(grid): verify data-grid integration and regression cases`

### T13 - Đánh giá accessibility và Lighthouse

- [ ] Kiểm tra toàn bộ luồng bằng bàn phím và ít nhất một trình đọc màn hình, ví dụ NVDA.
- [ ] Kiểm tra tên bảng, tiêu đề cột, vị trí ô, trạng thái sort, lựa chọn và thông báo cập nhật.
- [ ] Rà các tiêu chí WCAG 2.2 AA áp dụng; phân biệt đạt, chưa đạt, chưa kiểm tra và không áp dụng.
- [ ] Chạy Lighthouse trên ứng dụng được phục vụ qua HTTP; đạt Accessibility 100 và Best Practices 100.
- [ ] Lưu báo cáo cùng ngày đo, trình duyệt/phiên bản, URL, cấu hình và commit được kiểm tra.
- [ ] Nếu có sửa code sau đo, kiểm tra lại phần bị ảnh hưởng và đo lại bản cuối.

Hoàn thành khi: có bằng chứng thật cho các yêu cầu; không dùng điểm Lighthouse thay cho kiểm tra WCAG thủ công.

Commit: `docs(a11y): record accessibility checks and Lighthouse evidence`

### T14 - Báo cáo AI và tài liệu chạy bài

- [ ] Ghi lỗi AI thực sự được phát hiện trong quá trình làm: ngữ cảnh, code/hành vi lỗi, cách phát hiện, sửa và kiểm tra lại.
- [ ] Đối chiếu yêu cầu audit chung của lab về 3 lỗi; không bịa đủ số lượng hoặc coi lỗi slide là lỗi AI do mình phát hiện trong bài làm.
- [ ] Nếu chưa đủ bằng chứng, ghi đúng trạng thái còn thiếu; không tuyên bố audit hoàn tất.
- [ ] Viết README: mô tả HW1, branch, cách chạy, chức năng, phím tắt và cách chạy test.
- [ ] Ghi các lựa chọn triển khai ở mục 3 và các giới hạn còn lại.
- [ ] Chuẩn bị lời giải thích ngắn về pipeline dữ liệu, quản lý focus, event delegation và kiểm chứng.

Hoàn thành khi: người khác có thể clone branch, chạy và kiểm tra bài theo README; báo cáo audit phản ánh đúng bằng chứng.

Commit: `docs(hw1): add run instructions and AI failure audit`

### T15 - Rà soát và nộp branch

- [ ] Rà lại R01-R07 và các tác vụ; không bỏ qua mục chưa đạt.
- [ ] Kiểm tra diff, trạng thái Git và lịch sử commit; chỉ có file cần thiết cho bài.
- [ ] Bảo đảm không có thông tin bí mật, file tạm hoặc báo cáo chứa dữ liệu riêng tư bị đưa vào repo.
- [ ] Thử chạy theo README từ bản source đã commit.
- [ ] Push branch bằng git push -u origin hw1/data-grid.
- [ ] Xác nhận commit mới nhất trên GitHub khớp commit nộp; ghi đường dẫn branch trong báo cáo.

Hoàn thành khi: branch trên GitHub chứa bản đã kiểm chứng và tài liệu tương ứng. Không cần tạo commit chỉ để ghi nhận thao tác push.

## 7. Ma trận kiểm tra tối thiểu

| Nhóm | Tình huống | Kết quả mong đợi |
|---|---|---|
| Dữ liệu | ID trùng hoặc giá sai kiểu trong fixture | Kiểm tra dữ liệu phát hiện được lỗi |
| Lọc | Từ khóa không tồn tại | Thông báo rỗng đúng, không lỗi phân trang |
| Lọc | Gõ liên tục trong tìm kiếm | Không mất focus hoặc vị trí con trỏ |
| Sort | Dữ liệu số 2, 10, 100 | Thứ tự theo số, không theo chuỗi |
| Sort | Hai dòng có cùng giá | Thứ tự hòa ổn định |
| Phân trang | Đang trang cuối rồi thu hẹp bộ lọc | Về trang hợp lệ, số đếm đúng |
| Lựa chọn | Chọn sản phẩm rồi sort/lọc/đổi trang | Vẫn chọn đúng ID, không chuyển sang sản phẩm khác |
| Bàn phím | Mũi tên, Enter, Space, Tab và Shift+Tab | Đúng contract, không thao tác kép, không mắc kẹt |
| Focus | Dòng đang focus bị loại bởi bộ lọc | Focus được xử lý theo contract, không rơi vô định |
| Screen reader | Di chuyển, sort và chọn dòng | Đọc được ngữ cảnh và trạng thái phù hợp |
| An toàn | Text dữ liệu có ký tự giống HTML | Hiển thị như text, không thực thi hoặc chèn node |
| Vòng đời | Render và tương tác nhiều lần | Không nhân đôi listener hoặc handler |
| Lighthouse | Bản cuối của HW1 | Accessibility 100; Best Practices 100 |

## 8. Nhật ký tiến độ và bằng chứng

Điền khi thực sự thực hiện. Không đánh dấu hoàn thành từ nội dung kế hoạch.

| Task | Trạng thái | Bằng chứng kiểm tra | Commit |
|---|---|---|---|
| T01-T15 | Chưa xác nhận thực hiện | Chưa ghi nhận | Chưa ghi nhận |

## 9. Definition of Done

- [ ] R01-R07 đã có bằng chứng nghiệm thu.
- [ ] Các tác vụ cần thiết hoàn tất; không còn lỗi chặn sử dụng.
- [ ] Có test logic, kiểm thử trình duyệt, bàn phím và screen reader thực tế.
- [ ] Có báo cáo Lighthouse đúng điểm yêu cầu trên bản nộp.
- [ ] Tài liệu quy trình, README và audit có nội dung trung thực, nhất quán với code.
- [ ] Commit rõ ràng, không trộn HW2/HW3 và không tạo lịch sử giả.
- [ ] Branch hw1/data-grid đã được push và xác nhận trên GitHub.
