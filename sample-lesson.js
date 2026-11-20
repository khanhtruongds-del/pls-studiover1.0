// Bài mẫu để chạy thử (tự soạn, chưa phải dữ liệu thật). Cấu trúc spec giữ đúng tên ô của mẫu Figma.
// slides[]: { comp, data } dựng thẳng 1 mẫu; hoặc { auto: 'vocab', items: [...] } để máy tự chọn mẫu + chia slide.
window.PLS_SAMPLE = {
  brand: 'Betreux',
  lesson: 'B1 · Bài 7 · Wohnen',
  common: { 'header.topic': 'Wohnen' },
  slides: [
    { comp: 'Slide/Cover', data: { 'lesson': 'LEKTION 7', 'title.de': 'Wohnen in der Stadt', 'title.vi': 'Nhà ở trong thành phố', 'tagline': 'Deutsch B1 · Betreux' } },
    { comp: 'Slide/Section', data: { 'section.title': 'Wortschatz', 'section.sub': 'Từ vựng về nhà ở' } },
    { auto: 'vocab', section: 'WORTSCHATZ', items: [
      { de: 'die Wohnung', vi: 'căn hộ' }, { de: 'das Zimmer', vi: 'căn phòng' }, { de: 'die Küche', vi: 'nhà bếp' },
      { de: 'das Badezimmer', vi: 'phòng tắm' }, { de: 'der Balkon', vi: 'ban công' }, { de: 'der Flur', vi: 'hành lang' },
      { de: 'das Schlafzimmer', vi: 'phòng ngủ' }, { de: 'die Waschmaschine', vi: 'máy giặt' }, { de: 'der Vermieter', vi: 'chủ nhà cho thuê' },
      { de: 'die Nebenkosten', vi: 'chi phí phụ (điện, nước, sưởi)' } ] },
    { comp: 'Slide/Grammar Table', data: { 'header.section': 'GRAMMATIK', 'title': 'Wechselpräpositionen: Wo? – Wohin?',
      'row_0.c1': 'Wo? (Dativ)', 'row_0.c2': 'Wohin? (Akkusativ)',
      'row_1.c1': 'Das Bild hängt an der Wand.', 'row_1.c2': 'Ich hänge das Bild an die Wand.',
      'row_2.c1': 'Die Lampe steht auf dem Tisch.', 'row_2.c2': 'Ich stelle die Lampe auf den Tisch.',
      'row_3.c1': 'Der Teppich liegt im Flur.', 'row_3.c2': 'Ich lege den Teppich in den Flur.' } },
    { comp: 'Slide/Grammar Rule', data: { 'header.section': 'GRAMMATIK', 'title': 'Nebensatz mit „weil“',
      'rule': 'Trong mệnh đề phụ với „weil“, động từ chia đứng ở cuối câu.',
      'ex_1.de': 'Ich suche eine neue Wohnung, weil meine Wohnung zu klein ist.', 'ex_1.vi': 'Tôi tìm căn hộ mới vì căn hộ của tôi quá nhỏ.',
      'ex_2.de': 'Wir ziehen um, weil die Miete zu hoch ist.', 'ex_2.vi': 'Chúng tôi chuyển nhà vì tiền thuê quá cao.' } },
    { comp: 'Slide/Exercise MC', data: { 'header.section': 'ÜBUNG', 'instruction': 'Wählen Sie die richtige Antwort.',
      'question': 'Die Lampe hängt über ___ Tisch.', 'opt_A.key': 'A', 'opt_A.text': 'den', 'opt_B.key': 'B', 'opt_B.text': 'dem',
      'opt_C.key': 'C', 'opt_C.text': 'der', 'opt_D.key': 'D', 'opt_D.text': 'die' } },
    { comp: 'Slide/Dialogue', data: { 'header.section': 'DIALOG', 'img:img': 'căn hộ', 'situation': 'Bei der Wohnungsbesichtigung – Đi xem căn hộ',
      'line_1.speaker': 'Anna', 'line_1.de': 'Guten Tag! Ist die Wohnung noch frei?', 'line_1.vi': 'Chào anh! Căn hộ còn trống không ạ?',
      'line_2.speaker': 'Herr Weber', 'line_2.de': 'Ja, ab dem ersten Mai.', 'line_2.vi': 'Còn, từ ngày 1 tháng 5.',
      'line_3.speaker': 'Anna', 'line_3.de': 'Wie hoch sind die Nebenkosten?', 'line_3.vi': 'Chi phí phụ là bao nhiêu ạ?',
      'line_4.speaker': 'Herr Weber', 'line_4.de': 'Ungefähr 150 Euro im Monat.', 'line_4.vi': 'Khoảng 150 euro mỗi tháng.' } },
    { comp: 'Slide/End', data: { 'thanks.de': 'Vielen Dank!', 'thanks.vi': 'Cảm ơn các bạn!' } }
  ]
};
