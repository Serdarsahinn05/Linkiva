@AGENTS.md

## Claude Code'a özel

- **Skill tahkimi:** Tasarım otoritesi `DESIGN.md`. `ui-ux-pro-max` önerileri ona uyar. UI inşasında `impeccable` kullanılır. Görsel yön kullanıcı tarafından sabitlendi: "Cam" (glass, monokrom, semantik neon, mobilde alt sekme çubuğu). Seed ile yeni yön aranmaz. Denetim sırası önce `impeccable audit`/`critique`, sonra `ponytail-review`. Sadeleştirme (`ponytail`) ile cesaretlendirme (`impeccable bolder`) aynı turda çalıştırılmaz.
- **Kütüphane:** Yeni paket önermeden önce `package.json`'a bak ve kullanıcıya sor (AGENTS.md → Bağımlılıklar).
- **Tarayıcı doğrulaması:** UI değişikliklerinden sonra `run` skill'i veya claude-in-chrome ile 390px ve 1440px ekran görüntüsü al. Tek batch halinde, en fazla iki tur.
- **Faz takibi:** Çok adımlı işlerde ROADMAP'teki ilgili fazın kutucuklarını iş bittikçe işaretle.
- **Güvenlik:** Mutasyon içeren her değişiklikten sonra ARCHITECTURE §11 kontrol listesini uygula. Faz sonlarında `/security-review` öner.
