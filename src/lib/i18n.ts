import type { LangCode, SectionDef } from './types';

export const SECTION_DEFS: SectionDef[] = [
  { id: 'recap',    en: 'Meeting Recap',     zh: '会议回顾',     zhTW: '會議回顧',     fr: 'Récapitulatif de la réunion', de: 'Besprechungsrückblick', ptBR: 'Resumo da reunião',   ph: 'e.g. Both parties exchanged views on the 2026 annual cooperation scope…' },
  { id: 'needs',    en: 'Your Requirements', zh: '客户需求要点', zhTW: '客戶需求要點', fr: 'Vos besoins',                 de: 'Ihre Anforderungen',    ptBR: 'Suas necessidades',   ph: 'e.g. Need data subscriptions covering 3 business lines…' },
  { id: 'solution', en: 'Proposed Solution', zh: '我们的方案',   zhTW: '我們的方案',   fr: 'Solution proposée',           de: 'Vorgeschlagene Lösung', ptBR: 'Solução proposta',    ph: 'e.g. Recommend Professional subscription + custom training…' },
  { id: 'next',     en: 'Next Steps',        zh: '下一步行动',   zhTW: '下一步行動',   fr: 'Prochaines étapes',           de: 'Nächste Schritte',      ptBR: 'Próximos passos',     ph: 'e.g. Send formal contract draft before 20 July…' },
];

export const QUOTE_TITLES: Record<LangCode, string> = {
  en: 'Commercial Proposal', zh: '报价方案', zhTW: '報價方案',
  fr: 'Proposition commerciale', de: 'Angebot', ptBR: 'Proposta comercial',
};

export const LANG_LABELS: Record<LangCode, string> = {
  en: 'English', zh: '简体中文', zhTW: '繁體中文',
  fr: 'Français', de: 'Deutsch', ptBR: 'Português (BR)',
};

export type I18nKey =
  | 'appTitle' | 'appSub' | 'btnSummary' | 'btnFollowupEmail' | 'btnPrices' | 'btnAiCfg'
  | 'secBasic' | 'flagCover' | 'lblClient' | 'phClient' | 'lblContact' | 'phContact'
  | 'lblDate' | 'lblOwner' | 'phOwner' | 'lblOutLang' | 'lblCurrency' | 'sumNotes'
  | 'phNotes' | 'btnGenSec' | 'btnMatch' | 'hintNotes' | 'lblWriteToPpt' | 'btnAddItem'
  | 'calcTitle' | 'calcFloorHint' | 'lblCalcFirm' | 'lblCombo' | 'lblInsightDep'
  | 'calcOutHint' | 'thItem' | 'thQty' | 'thPrice' | 'thDisc' | 'thSub'
  | 'thY2a' | 'thY2up' | 'thY2b' | 'btnAddQuote' | 'lblGlobalDisc' | 'lblVat'
  | 'lblProdIntro' | 'lblTwoYear' | 'lblY2Uplift' | 'lblQuoteNote' | 'phQuoteNote'
  | 'btnReset' | 'btnExport' | 'dlgPrices' | 'pricesHint' | 'thProdName' | 'thUnit'
  | 'thPrice2' | 'thDesc' | 'thKw' | 'btnAddProd' | 'btnRestorePrices' | 'btnSavePrices'
  | 'btnClose' | 'btnCopy' | 'btnDownloadMd' | 'dlgAiCfg' | 'aiCfgHint' | 'lblProvider'
  | 'lblEndpoint' | 'lblModel' | 'lblKeyHeader' | 'lblKeyPrefix' | 'btnCancel' | 'btnClear'
  | 'btnSave' | 'uiLangTitle' | 'flashPricesSaved' | 'flashAiSaved' | 'flashCopied'
  | 'flashAutosaved' | 'flashPptDownloaded' | 'alertNoAi' | 'alertNoNotes' | 'confirmOverwrite'
  | 'btnGenerating' | 'genSecDone' | 'genSecEmpty' | 'genFail' | 'sumTitleManual'
  | 'sumHintManual' | 'sumTitleGen' | 'sumHintCalling' | 'sumHintDone' | 'sumHintFail'
  | 'matchNoHit' | 'matchHitLabel' | 'btnAddToQuote' | 'btnAdded' | 'phRowName'
  | 'phPriceDesc' | 'phPriceKw' | 'titleItemCk' | 'metaBundle' | 'metaFlat'
  | 'warnBelowY1' | 'btnAddContact' | 'btnExtractContacts' | 'contactsExtracted'
  | 'contactsNone' | 'emailTitle' | 'emailHintDone' | 'term1y' | 'term2y' | 'termBoth'
  | 'confirmReset' | 'optionWord' | 'oneYearTerm' | 'twoYearTerm' | 'deptsWord'
  | 'lblQuoteTerm' | 'lblTwoYrDisc' | 'uploadNotes' | 'uploadDone' | 'uploadFail'
  | 'thanks' | 'uploadParsing'
  | 'stepWord' | 'navStep1' | 'navStep2' | 'navStep3' | 'navStep4'
  | 'navStep1Sub' | 'navStep2Sub' | 'navStep3Sub' | 'navStep4Sub' | 'step2Empty'
  | 'btnGenComms' | 'commsHint';

type I18nMap = Record<I18nKey, [string, string, string, string, string, string]>;

export const I18N: I18nMap = {
  appTitle:          ['Sales Follow-up PPT Generator', '销售跟进 PPT 生成器', '銷售跟進 PPT 產生器', 'Générateur de PPT de suivi commercial', 'Vertriebs-Follow-up-PPT-Generator', 'Gerador de PPT de acompanhamento'],
  appSub:            ['Meeting notes → select content → auto quote → export PPTX', '会议记录 → 勾选内容 → 自动报价 → 导出 PPTX', '會議記錄 → 勾選內容 → 自動報價 → 匯出 PPTX', 'Notes → sélection → devis → PPTX', 'Notizen → Auswahl → Angebot → PPTX', 'Notas → seleção → cotação → PPTX'],
  btnSummary:        ['📝 Internal summary', '📝 生成内部总结', '📝 產生內部總結', '📝 Résumé interne', '📝 Interne Zusammenfassung', '📝 Resumo interno'],
  btnFollowupEmail:  ['✉ Follow-up email', '✉ 生成跟进邮件', '✉ 產生跟進郵件', '✉ E-mail de suivi', '✉ Follow-up-E-Mail', '✉ E-mail de acompanhamento'],
  btnPrices:         ['⚙ Price list & selling points', '⚙ 管理价目表与卖点库', '⚙ 管理價目表與賣點庫', '⚙ Tarifs et arguments', '⚙ Preisliste & Argumente', '⚙ Preços e argumentos'],
  btnAiCfg:          ['🤖 AI settings', '🤖 AI 设置', '🤖 AI 設定', '🤖 Paramètres IA', '🤖 KI-Einstellungen', '🤖 Config. de IA'],
  secBasic:          ['Basic information', '基本信息', '基本資訊', 'Informations générales', 'Grunddaten', 'Informações básicas'],
  flagCover:         ['On cover', '写入封面', '寫入封面', 'Sur la couverture', 'Auf Deckblatt', 'Na capa'],
  lblClient:         ['Client firm', '客户公司', '客戶公司', 'Cabinet client', 'Kanzlei', 'Escritório cliente'],
  phClient:          ['Type firm name…', '输入所名…', '輸入所名…', 'Saisir le cabinet…', 'Kanzlei eingeben…', 'Digite o escritório…'],
  lblContact:        ['Client contact(s)', '客户联系人', '客戶聯絡人', 'Contact client', 'Ansprechpartner', 'Contato do cliente'],
  phContact:         ['e.g. Jane Smith', '例如：Jane Smith', '例如：Jane Smith', 'ex. : Jane Smith', 'z. B. Jane Smith', 'ex.: Jane Smith'],
  lblDate:           ['Meeting date', '会议日期', '會議日期', 'Date de la réunion', 'Besprechungsdatum', 'Data da reunião'],
  lblOwner:          ['Our lead', '我方负责人', '我方負責人', 'Notre responsable', 'Unser Ansprechpartner', 'Nosso responsável'],
  phOwner:           ['e.g. Sha Zhang', '例如：Sha Zhang', '例如：Sha Zhang', 'ex. : Sha Zhang', 'z. B. Sha Zhang', 'ex.: Sha Zhang'],
  lblOutLang:        ['PPT language', 'PPT 语言', 'PPT 語言', 'Langue du PPT', 'PPT-Sprache', 'Idioma do PPT'],
  lblCurrency:       ['Currency', '货币', '貨幣', 'Devise', 'Währung', 'Moeda'],
  sumNotes:          ['📋 Meeting notes (reference only)', '📋 会议记录（参考用）', '📋 會議記錄（參考用）', '📋 Notes de réunion (référence)', '📋 Besprechungsnotizen (Referenz)', '📋 Notas da reunião (referência)'],
  phNotes:           ['Paste meeting notes / transcript here for reference. This content will not appear in the PPT.', '把会议记录粘贴到这里，此内容不会出现在 PPT 中。', '把會議記錄貼到這裡，此內容不會出現在 PPT 中。', 'Collez ici les notes. Ce contenu n\'apparaît pas dans le PPT.', 'Notizen einfügen. Erscheint nicht im PPT.', 'Cole as notas aqui. Não aparece no PPT.'],
  btnGenSec:         ['🤖 AI-generate section points', '🤖 AI 生成各版块要点', '🤖 AI 產生各版塊要點', '🤖 Générer les points (IA)', '🤖 Abschnittspunkte (KI)', '🤖 Gerar tópicos (IA)'],
  btnMatch:          ['🔍 Match products from notes', '🔍 根据记录匹配产品', '🔍 依記錄比對產品', '🔍 Associer les produits', '🔍 Produkte abgleichen', '🔍 Combinar produtos'],
  hintNotes:         ['AI generates checkable bullet points for four sections; checked ones go into the PPT.', 'AI 生成四个版块要点（勾选的才写入 PPT）；产品按关键词匹配。', 'AI 產生四版塊要點（勾選的才寫入 PPT）；產品按關鍵字比對。', 'L\'IA génère des points cochables (seuls cochés → PPT) ; produits par mot-clé.', 'KI erzeugt Punkte (nur angehakte → PPT); Produkte per Stichwort.', 'IA gera tópicos (só marcados → PPT); produtos por palavra-chave.'],
  lblWriteToPpt:     ['Include in PPT', '写入 PPT', '寫入 PPT', 'Inclure dans le PPT', 'Ins PPT übernehmen', 'Incluir no PPT'],
  btnAddItem:        ['＋ Add point', '＋ 添加要点', '＋ 新增要點', '＋ Ajouter un point', '＋ Punkt hinzufügen', '＋ Adicionar tópico'],
  calcTitle:         ['FY27 Quote Calculator', 'FY27 报价计算器', 'FY27 報價計算器', 'Calculateur de devis FY27', 'FY27-Angebotsrechner', 'Calculadora de cotação FY27'],
  calcFloorHint:     ['Discount floors shown here only — never in the exported PPT.', '折扣底线仅在此处显示，不写入 PPT。', '折扣底線僅在此處顯示，不寫入 PPT。', 'Planchers de remise ici seulement — jamais dans le PPT.', 'Rabatt-Untergrenzen nur hier — nie im PPT.', 'Pisos de desconto só aqui — nunca no PPT.'],
  lblCalcFirm:       ['Quote client (select in Basic info)', '报价客户（在基本信息选择）', '報價客戶（在基本資訊選擇）', 'Client du devis (choisir dans Infos générales)', 'Angebotskunde (in Grunddaten wählen)', 'Cliente da cotação (em Informações básicas)'],
  lblCombo:          ['Current bundle (auto)', '当前组合（自动）', '目前組合（自動）', 'Offre actuelle (auto)', 'Aktuelles Paket (auto)', 'Pacote atual (auto)'],
  lblInsightDep:     ['Insight type / dept. count', 'Insight 类型 / 部门数', 'Insight 類型 / 部門數', 'Type Insight / nbre de dép.', 'Insight-Typ / Abteilungsanzahl', 'Tipo Insight / nº de deptos.'],
  calcOutHint:       ['Prices appear after you select a firm.', '选择客户后自动出价。', '選擇客戶後自動出價。', 'Les prix apparaissent après avoir choisi un cabinet.', 'Preise erscheinen nach Auswahl einer Kanzlei.', 'Preços aparecem após selecionar um escritório.'],
  thItem:            ['Item', '项目', '項目', 'Élément', 'Position', 'Item'],
  thQty:             ['Qty', '数量', '數量', 'Qté', 'Menge', 'Qtd.'],
  thPrice:           ['Price', '价格', '價格', 'Prix', 'Preis', 'Preço'],
  thDisc:            ['Disc. %', '折扣%', '折扣%', 'Remise %', 'Rabatt %', 'Desc. %'],
  thSub:             ['Subtotal', '小计', '小計', 'Sous-total', 'Zwischensumme', 'Subtotal'],
  thY2a:             ['2-yr Y1 price', '两年首年价', '兩年首年價', 'Prix 2 ans an 1', '2J Preis Jahr 1', 'Preço 2a ano 1'],
  thY2up:            ['2-yr uplift %', '两年·涨幅%', '兩年·漲幅%', 'Hausse 2 ans %', '2J-Anstieg %', 'Aumento 2a %'],
  thY2b:             ['2-yr Y2 price', '两年次年价', '兩年次年價', 'Prix 2 ans an 2', '2J Preis Jahr 2', 'Preço 2a ano 2'],
  btnAddQuote:       ['＋ Add quote line', '＋ 添加报价项', '＋ 新增報價項', '＋ Ajouter une ligne', '＋ Angebotszeile hinzufügen', '＋ Adicionar item'],
  lblGlobalDisc:     ['Overall discount %', '整单折扣 %', '整單折扣 %', 'Remise globale %', 'Gesamtrabatt %', 'Desconto geral %'],
  lblVat:            ['Add VAT 20%', '加收 VAT 20%', '加收 VAT 20%', 'Ajouter TVA 20 %', 'MwSt. 20 % hinzufügen', 'Adicionar IVA 20%'],
  lblProdIntro:      ['Attach product intro pages', '附产品介绍页', '附產品介紹頁', 'Joindre les pages produit', 'Produkt-Infoseiten anhängen', 'Anexar páginas de produto'],
  lblTwoYear:        ['Two-year contract', '两年合约', '兩年合約', 'Contrat de deux ans', 'Zweijahresvertrag', 'Contrato de dois anos'],
  lblY2Uplift:       ['Year-2 uplift %', '第二年涨幅 %', '第二年漲幅 %', 'Hausse année 2 %', 'Steigerung Jahr 2 %', 'Aumento ano 2 %'],
  lblQuoteNote:      ['Quote notes (validity, payment terms…)', '报价备注（有效期、付款条件等）', '報價備註（有效期、付款條件等）', 'Notes du devis (validité, conditions de paiement…)', 'Angebotshinweise (Gültigkeit, Zahlungsbedingungen…)', 'Observações (validade, condições de pagamento…)'],
  phQuoteNote:       ['e.g. Quote valid for 30 days; annual payment, due within 30 days of invoice.', '例如：报价有效期 30 天；年付，发票后 30 天内付款。', '例如：報價有效期 30 天；年付，發票後 30 天內付款。', 'ex. : Devis valable 30 jours ; paiement annuel sous 30 jours.', 'z. B. Angebot 30 Tage gültig; jährliche Zahlung, 30 Tage.', 'ex.: Cotação válida 30 dias; pagamento anual em até 30 dias.'],
  btnReset:          ['Reset', '清空重填', '清空重填', 'Réinitialiser', 'Zurücksetzen', 'Redefinir'],
  btnExport:         ['⬇ Generate & download PPTX', '⬇ 生成并下载 PPTX', '⬇ 產生並下載 PPTX', '⬇ Générer et télécharger le PPTX', '⬇ PPTX erstellen & herunterladen', '⬇ Gerar e baixar PPTX'],
  dlgPrices:         ['Price list management', '价目表管理', '價目表管理', 'Gestion des tarifs', 'Preislistenverwaltung', 'Gestão de preços'],
  pricesHint:        ['Maintain products and prices here; the quote table auto-fills the price on name match. Click Save — stored in your browser.', '在此维护产品与价格，报价表名称匹配时自动带出价格。修改后点「保存」。', '在此維護產品與價格，報價表名稱匹配時自動帶出價格。修改後點「儲存」。', 'Gérez produits et prix ici ; le devis remplit automatiquement le prix. Cliquez sur Enregistrer.', 'Produkte und Preise pflegen; automatischer Preis-Fill. Speichern klicken.', 'Gerencie produtos e preços aqui; preço preenchido automaticamente. Clique em Salvar.'],
  thProdName:        ['Product / service name', '产品 / 服务名称', '產品 / 服務名稱', 'Nom du produit / service', 'Produkt-/Dienstname', 'Nome do produto / serviço'],
  thUnit:            ['Unit', '单位', '單位', 'Unité', 'Einheit', 'Unidade'],
  thPrice2:          ['Price', '价格', '價格', 'Prix', 'Preis', 'Preço'],
  thDesc:            ['Product intro (one selling point per line)', '产品介绍（一行一条卖点）', '產品介紹（一行一條賣點）', 'Présentation (un argument par ligne)', 'Produktinfo (ein Argument pro Zeile)', 'Descrição (um argumento por linha)'],
  thKw:              ['Trigger keywords (comma-separated)', '触发关键词（逗号分隔）', '觸發關鍵字（逗號分隔）', 'Mots-clés déclencheurs (virgule)', 'Trigger-Stichwörter (kommagetrennt)', 'Palavras-chave (vírgula)'],
  btnAddProd:        ['＋ Add product', '＋ 添加产品', '＋ 新增產品', '＋ Ajouter un produit', '＋ Produkt hinzufügen', '＋ Adicionar produto'],
  btnRestorePrices:  ['Restore sample prices', '恢复示例价目', '還原範例價目', 'Restaurer les tarifs exemples', 'Beispielpreise wiederherstellen', 'Restaurar preços de exemplo'],
  btnSavePrices:     ['Save price list', '保存价目表', '儲存價目表', 'Enregistrer les tarifs', 'Preisliste speichern', 'Salvar preços'],
  btnClose:          ['Close', '关闭', '關閉', 'Fermer', 'Schließen', 'Fechar'],
  btnCopy:           ['Copy', '复制', '複製', 'Copier', 'Kopieren', 'Copiar'],
  btnDownloadMd:     ['Download .md', '下载 .md', '下載 .md', 'Télécharger .md', '.md herunterladen', 'Baixar .md'],
  dlgAiCfg:         ['AI endpoint settings', 'AI 端点设置', 'AI 端點設定', 'Paramètres du point de terminaison IA', 'KI-Endpunkt-Einstellungen', 'Configurações do endpoint de IA'],
  aiCfgHint:        ['Configure an AI endpoint for one-click generation. Use only a Chambers-approved endpoint — meeting notes may contain client PII (GDPR / UK DPA 2018). Credentials are stored only in your browser.', '配置 AI 端点后可一键生成内容。请仅使用 Chambers 批准的端点——会议记录可能含客户个人数据（GDPR / UK DPA 2018）。凭据仅保存在本机浏览器。', '設定 AI 端點後可一鍵產生內容。請僅使用 Chambers 核准的端點——會議記錄可能含個人資料（GDPR / UK DPA 2018）。憑證僅儲存於本機瀏覽器。', 'Configurez un endpoint IA pour la génération en un clic. N\'utilisez qu\'un endpoint approuvé par Chambers — les notes peuvent contenir des données personnelles clients (RGPD / UK DPA 2018).', 'KI-Endpunkt für Ein-Klick-Generierung konfigurieren. Nur von Chambers genehmigten Endpunkt verwenden — Notizen können personenbezogene Daten enthalten (DSGVO / UK DPA 2018).', 'Configure um endpoint de IA para geração em um clique. Use apenas endpoint aprovado pela Chambers — notas podem conter dados pessoais (GDPR / UK DPA 2018).'],
  lblProvider:       ['AI provider', 'AI 提供方', 'AI 提供方', 'Fournisseur IA', 'KI-Anbieter', 'Provedor de IA'],
  lblEndpoint:       ['Endpoint URL', '端点 URL', '端點 URL', 'URL du point de terminaison', 'Endpunkt-URL', 'URL do endpoint'],
  lblModel:          ['Model / deployment name', '模型名 / 部署名', '模型名 / 部署名', 'Nom du modèle / déploiement', 'Modell-/Bereitstellungsname', 'Nome do modelo / implantação'],
  lblKeyHeader:      ['Auth header name', '鉴权头名称', '鑑權標頭名稱', 'Nom de l\'en-tête d\'auth', 'Name des Auth-Headers', 'Nome do cabeçalho de auth'],
  lblKeyPrefix:      ['Key prefix', 'Key 前缀', 'Key 前綴', 'Préfixe de la clé', 'Schlüssel-Präfix', 'Prefixo da chave'],
  btnCancel:         ['Cancel', '取消', '取消', 'Annuler', 'Abbrechen', 'Cancelar'],
  btnClear:          ['Clear', '清除', '清除', 'Effacer', 'Löschen', 'Limpar'],
  btnSave:           ['Save', '保存', '儲存', 'Enregistrer', 'Speichern', 'Salvar'],
  uiLangTitle:       ['Interface language', '界面语言', '介面語言', 'Langue de l\'interface', 'Oberflächensprache', 'Idioma da interface'],
  flashPricesSaved:  ['Price list saved', '价目表已保存', '價目表已儲存', 'Tarifs enregistrés', 'Preisliste gespeichert', 'Preços salvos'],
  flashAiSaved:      ['AI settings saved', 'AI 设置已保存', 'AI 設定已儲存', 'Paramètres IA enregistrés', 'KI-Einstellungen gespeichert', 'Configurações de IA salvas'],
  flashCopied:       ['Copied', '已复制', '已複製', 'Copié', 'Kopiert', 'Copiado'],
  flashAutosaved:    ['Auto-saved', '已自动保存', '已自動儲存', 'Enregistré automatiquement', 'Automatisch gespeichert', 'Salvo automaticamente'],
  flashPptDownloaded:['PPTX downloaded', 'PPTX 已下载', 'PPTX 已下載', 'PPTX téléchargé', 'PPTX heruntergeladen', 'PPTX baixado'],
  alertNoAi:         ['Please configure the AI provider and key in "🤖 AI settings" first.', '请先在「🤖 AI 设置」配置 AI 提供方与密钥。', '請先在「🤖 AI 設定」設定 AI 提供方與密鑰。', 'Configurez d\'abord le fournisseur IA dans « 🤖 Paramètres IA ».', 'Bitte zuerst KI-Anbieter unter „🤖 KI-Einstellungen" konfigurieren.', 'Configure primeiro o provedor de IA em "🤖 Configurações de IA".'],
  alertNoNotes:      ['Please paste the meeting notes first.', '请先粘贴会议记录。', '請先貼上會議記錄。', 'Collez d\'abord les notes de réunion.', 'Bitte zuerst die Besprechungsnotizen einfügen.', 'Cole primeiro as notas da reunião.'],
  confirmOverwrite:  ['This will overwrite the current section content with AI-generated points. Continue?', '将用 AI 生成的要点覆盖现有内容，继续？', '將以 AI 產生的要點覆蓋現有內容，繼續？', 'Ceci remplacera le contenu par des points IA. Continuer ?', 'Dies überschreibt den Inhalt mit KI-Punkten. Fortfahren?', 'Substituirá o conteúdo por tópicos IA. Continuar?'],
  btnGenerating:     ['⏳ Generating…', '⏳ 生成中…', '⏳ 產生中…', '⏳ Génération…', '⏳ Wird erstellt…', '⏳ Gerando…'],
  genSecDone:        ['Generated points for {n} section(s)', '已生成 {n} 个版块要点', '已產生 {n} 個版塊要點', 'Points générés pour {n} section(s)', 'Punkte erstellt für {n} Abschnitt(e)', 'Tópicos gerados para {n} seção(ões)'],
  genSecEmpty:       ['AI returned no usable points; please retry', 'AI 未返回可用要点，请重试', 'AI 未傳回可用要點，請重試', 'L\'IA n\'a renvoyé aucun point utilisable ; réessayez', 'Die KI lieferte keine Punkte; bitte erneut versuchen', 'A IA não retornou tópicos úteis; tente novamente'],
  genFail:           ['Generation failed: ', '生成失败：', '產生失敗：', 'Échec de la génération : ', 'Erstellung fehlgeschlagen: ', 'Falha na geração: '],
  sumTitleManual:    ['Internal summary · prompt (manual mode)', '内部总结 · 提示词（手动模式）', '內部總結 · 提示詞（手動模式）', 'Résumé interne · invite (mode manuel)', 'Interne Zusammenfassung · Prompt (manuell)', 'Resumo interno · prompt (modo manual)'],
  sumHintManual:     ['No AI configured. Copy the prompt below into Claude to generate the summary.', '未配置 AI。请复制下方提示词到 Claude 生成内部总结。', '未設定 AI。請複製下方提示詞到 Claude 產生內部總結。', 'Aucune IA configurée. Copiez l\'invite ci-dessous dans Claude.', 'Keine KI konfiguriert. Kopieren Sie den Prompt in Claude.', 'Nenhuma IA configurada. Copie o prompt abaixo no Claude.'],
  sumTitleGen:       ['Internal record summary', '内部记录总结', '內部記錄總結', 'Résumé de suivi interne', 'Interne Zusammenfassung', 'Resumo interno'],
  sumHintCalling:    ['Calling AI…', '正在调用 AI 生成…', '正在呼叫 AI 產生…', 'Appel de l\'IA…', 'KI wird aufgerufen…', 'Chamando a IA…'],
  sumHintDone:       ['AI-generated — review before archiving/sending (do not alter client facts or quotes).', '由 AI 生成，存档前请人工复核。', '由 AI 產生，存檔前請人工複核。', 'Généré par IA — vérifiez avant archivage.', 'KI-generiert — vor Archivierung prüfen.', 'Gerado por IA — revise antes de arquivar.'],
  sumHintFail:       ['Call failed; fell back to manual prompt mode. Error: ', '调用失败，已回退到手动模式。错误：', '呼叫失敗，已回退手動模式。錯誤：', 'Échec de l\'appel. Erreur : ', 'Aufruf fehlgeschlagen. Fehler: ', 'Falha na chamada. Erro: '],
  matchNoHit:        ['No product keywords matched. Add trigger keywords in "Price list".', '未命中产品关键词。可在「价目表」中补充关键词。', '未命中產品關鍵字。可在「價目表」中補充關鍵字。', 'Aucun mot-clé trouvé. Ajoutez des mots-clés dans « Tarifs ».', 'Keine Stichwörter gefunden. Trigger-Stichwörter unter „Preisliste" ergänzen.', 'Nenhuma palavra-chave encontrada. Adicione palavras-chave em \"Preços\".'],
  matchHitLabel:     ['Matched: ', '命中：', '命中：', 'Correspondance : ', 'Treffer: ', 'Correspondência: '],
  btnAddToQuote:     ['Add to quote', '加入报价', '加入報價', 'Ajouter au devis', 'Zum Angebot', 'Adicionar à cotação'],
  btnAdded:          ['✓ Added', '✓ 已加入', '✓ 已加入', '✓ Ajouté', '✓ Hinzugefügt', '✓ Adicionado'],
  phRowName:         ['Product / item name', '产品 / 项目名称', '產品 / 項目名稱', 'Nom du produit / élément', 'Produkt-/Positionsname', 'Nome do produto / item'],
  phPriceDesc:       ['One selling point per line; shown on the product intro page', '一行一条卖点，写入产品介绍页', '一行一條賣點，寫入產品介紹頁', 'Un argument par ligne ; affiché sur la page produit', 'Ein Argument pro Zeile; auf der Produktseite', 'Um argumento por linha; exibido na página do produto'],
  phPriceKw:         ['e.g. training,onboarding', '如：培训,上手,onboarding', '如：培訓,上手,onboarding', 'ex. : formation,prise en main', 'z. B. Schulung,Onboarding', 'ex.: treinamento,onboarding'],
  titleItemCk:       ['Checked = include in PPT', '勾选=写入 PPT', '勾選=寫入 PPT', 'Coché = inclus dans le PPT', 'Angehakt = im PPT', 'Marcado = incluir no PPT'],
  metaBundle:        ['Bundle, incl. {parts} (PPT shows total only)', '合并报价，含 {parts}（PPT 只显示总价）', '合併報價，含 {parts}（PPT 只顯示總價）', 'Offre groupée, incl. {parts} (le PPT n\'affiche que le total)', 'Paket, inkl. {parts} (PPT zeigt nur die Summe)', 'Pacote, incl. {parts} (o PPT mostra só o total)'],
  metaFlat:          ['Price is the total; qty = dept. count', '价格为总价，数量=部门数', '價格為總價，數量=部門數', 'Le prix est le total ; qté = nbre de dép.', 'Preis ist die Summe; Menge = Abteilungsanzahl', 'O preço é o total; qtd. = nº de deptos.'],
  warnBelowY1:       ['Below year 1 — needs approval', '低于首年，需审批', '低於首年，需審批', 'Inférieur à l\'année 1 — approbation requise', 'Unter Jahr 1 — Genehmigung nötig', 'Abaixo do ano 1 — requer aprovação'],
  btnAddContact:     ['＋ Add contact', '＋ 添加联系人', '＋ 新增聯絡人', '＋ Ajouter un contact', '＋ Kontakt hinzufügen', '＋ Adicionar contato'],
  btnExtractContacts:['🤖 Extract from notes', '🤖 从记录提取', '🤖 從記錄擷取', '🤖 Extraire des notes', '🤖 Aus Notiz extrahieren', '🤖 Extrair das notas'],
  contactsExtracted: ['Contacts extracted', '已提取联系人', '已擷取聯絡人', 'Contacts extraits', 'Kontakte extrahiert', 'Contatos extraídos'],
  contactsNone:      ['No client contacts found', '未识别到客户联系人', '未辨識到客戶聯絡人', 'Aucun contact client trouvé', 'Keine Kundenkontakte gefunden', 'Nenhum contato encontrado'],
  emailTitle:        ['Client follow-up email', '客户跟进邮件', '客戶跟進郵件', 'E-mail de suivi client', 'Kunden-Follow-up-E-Mail', 'E-mail de acompanhamento'],
  emailHintDone:     ['AI-drafted client email — review wording and prices before sending.', 'AI 生成的客户邮件，发送前请人工复核措辞与报价。', 'AI 產生的客戶郵件，傳送前請人工複核措辭與報價。', 'E-mail client rédigé par IA — vérifiez avant envoi.', 'KI-Entwurf der Kunden-E-Mail — vor Versand prüfen.', 'E-mail gerado por IA — revise antes de enviar.'],
  term1y:            ['1 year only', '仅一年', '僅一年', '1 an seulement', 'Nur 1 Jahr', 'Apenas 1 ano'],
  term2y:            ['2-year contract', '两年合约', '兩年合約', 'Contrat 2 ans', 'Zweijahresvertrag', 'Contrato de 2 anos'],
  termBoth:          ['1-year + 2-year (client chooses)', '一年 + 两年（供选择）', '一年 + 兩年（供選擇）', '1 an + 2 ans (au choix)', '1 Jahr + 2 Jahre (zur Wahl)', '1 ano + 2 anos (à escolha)'],
  confirmReset:      ['Clear all entered content? (The price list is unaffected)', '确定清空所有已填内容？（价目表不受影响）', '確定清空所有已填內容？（價目表不受影響）', 'Effacer tout le contenu saisi ? (Les tarifs ne sont pas affectés)', 'Alle eingegebenen Inhalte löschen? (Preisliste bleibt unberührt)', 'Limpar todo o conteúdo inserido? (Os preços não são afetados)'],
  optionWord:        ['Option ', '方案', '方案', 'Option ', 'Option ', 'Opção '],
  oneYearTerm:       ['1-year', '一年期', '一年期', '1 an', '1 Jahr', '1 ano'],
  twoYearTerm:       ['2-year', '两年期', '兩年期', '2 ans', '2 Jahre', '2 anos'],
  deptsWord:         ['departments', '个部门', '個部門', 'départements', 'Abteilungen', 'departamentos'],
  lblQuoteTerm:      ['Quote term', '报价年限', '報價年限', 'Durée du devis', 'Angebotslaufzeit', 'Prazo da cotação'],
  lblTwoYrDisc:      ['2-yr Y1 discount %', '两年首年折扣 %', '兩年首年折扣 %', 'Remise 2 ans an 1 %', '2J-Rabatt Jahr 1 %', 'Desconto 2a ano 1 %'],
  uploadNotes:       ['📄 Upload meeting record', '📄 上传会议记录', '📄 上傳會議記錄', '📄 Importer le compte-rendu', '📄 Besprechungsnotiz hochladen', '📄 Carregar ata da reunião'],
  uploadDone:        ['Meeting record loaded into notes', '会议记录已导入', '會議記錄已匯入', 'Compte-rendu chargé', 'Notiz geladen', 'Ata carregada'],
  uploadFail:        ['Upload failed: ', '上传失败：', '上傳失敗：', 'Échec du chargement : ', 'Upload fehlgeschlagen: ', 'Falha no upload: '],
  uploadParsing:     ['Parsing file…', '正在解析文件…', '正在解析檔案…', 'Analyse du fichier…', 'Datei wird gelesen…', 'Lendo o arquivo…'],
  thanks:            ['Thank you', '感谢您', '感謝您', 'Merci', 'Vielen Dank', 'Obrigado'],
  stepWord:          ['Step', '步骤', '步驟', 'Étape', 'Schritt', 'Etapa'],
  navStep1:          ['Basics & notes', '基本信息与记录', '基本資訊與記錄', 'Infos & notes', 'Grunddaten & Notizen', 'Dados e notas'],
  navStep2:          ['AI content', 'AI 提取内容', 'AI 擷取內容', 'Contenu IA', 'KI-Inhalt', 'Conteúdo de IA'],
  navStep3:          ['Calculator & proposal', '计算器与报价', '計算器與報價', 'Calcul & devis', 'Rechner & Angebot', 'Cálculo e proposta'],
  navStep4:          ['Email & summary', '邮件与总结', '郵件與總結', 'E-mail & résumé', 'E-Mail & Zusammenfassung', 'E-mail e resumo'],
  navStep1Sub:       ['Client, meeting notes', '客户与会议记录', '客戶與會議記錄', 'Client, notes', 'Kunde, Notizen', 'Cliente, notas'],
  navStep2Sub:       ['Review AI bullet points', '复核 AI 要点', '複核 AI 要點', 'Vérifier les points IA', 'KI-Punkte prüfen', 'Revisar tópicos de IA'],
  navStep3Sub:       ['Price & build the quote', '定价与报价', '定價與報價', 'Tarif & devis', 'Preis & Angebot', 'Preço e cotação'],
  navStep4Sub:       ['Draft client comms', '生成沟通文案', '生成溝通文案', 'Rédiger les messages', 'Nachrichten verfassen', 'Redigir mensagens'],
  step2Empty:        ['No AI content yet. Go to Step 1, paste meeting notes and generate the section points.', '暂无 AI 内容。请回到步骤 1，粘贴会议记录并生成各版块要点。', '尚無 AI 內容。請回到步驟 1，貼上會議記錄並產生各版塊要點。', 'Aucun contenu IA. Revenez à l\'étape 1, collez les notes et générez les points.', 'Noch kein KI-Inhalt. Gehen Sie zu Schritt 1, fügen Sie Notizen ein und generieren Sie die Punkte.', 'Sem conteúdo de IA. Volte à etapa 1, cole as notas e gere os tópicos.'],
  btnGenComms:       ['✨ Generate email & internal summary', '✨ 一键生成邮件和内部总结', '✨ 一鍵產生郵件和內部總結', '✨ Générer e-mail & résumé interne', '✨ E-Mail & interne Zusammenfassung erstellen', '✨ Gerar e-mail e resumo interno'],
  commsHint:         ['The follow-up email is in your selected language; the internal summary is always in English.', '跟进邮件使用所选语言；内部总结始终为英文。', '跟進郵件使用所選語言；內部總結始終為英文。', 'L\'e-mail de suivi est dans la langue choisie ; le résumé interne est toujours en anglais.', 'Die Follow-up-E-Mail ist in der gewählten Sprache; die interne Zusammenfassung immer auf Englisch.', 'O e-mail de acompanhamento está no idioma escolhido; o resumo interno é sempre em inglês.'],
};

const LANG_IDX: Record<LangCode, number> = { en: 0, zh: 1, zhTW: 2, fr: 3, de: 4, ptBR: 5 };

export const ALL_LANGS: LangCode[] = ['en', 'zh', 'zhTW', 'fr', 'de', 'ptBR'];

export function t(key: I18nKey, lang: LangCode): string {
  const arr = I18N[key];
  if (!arr) return key;
  return arr[LANG_IDX[lang]] ?? arr[0];
}

export function sectionLabel(def: SectionDef, lang: LangCode): string {
  return def[lang] ?? def.en;
}

// ── Static labels baked into the exported PPT (translated by content language) ──
export type PptKey =
  | 'coverSubtitle' | 'presentationTo' | 'preparedBy' | 'dateLabel'
  | 'optionWord' | 'oneYearContract' | 'twoYearContract' | 'recommended'
  | 'annualTotal' | 'renewsNote' | 'totalWord' | 'twoYearTotal'
  | 'savingNote' | 'caption' | 'captionNoSave'
  | 'thProduct' | 'thQty' | 'thPrice' | 'thTotal'
  | 'backTitle' | 'backVisit' | 'contactWord';

const PPT_I18N: Record<PptKey, [string, string, string, string, string, string]> = {
  coverSubtitle:   ['Follow-Up Meeting', '跟进会议', '跟進會議', 'Réunion de suivi', 'Nachfasstermin', 'Reunião de acompanhamento'],
  presentationTo:  ['A presentation to:', '呈送对象：', '呈送對象：', 'Présentation destinée à :', 'Präsentation für:', 'Apresentação para:'],
  preparedBy:      ['Prepared by:', '制作人：', '製作人：', 'Préparé par :', 'Erstellt von:', 'Preparado por:'],
  dateLabel:       ['Date:', '日期：', '日期：', 'Date :', 'Datum:', 'Data:'],
  optionWord:      ['OPTION', '方案', '方案', 'OPTION', 'OPTION', 'OPÇÃO'],
  oneYearContract: ['1-Year Contract', '一年合约', '一年合約', 'Contrat 1 an', '1-Jahres-Vertrag', 'Contrato de 1 ano'],
  twoYearContract: ['2-Year Contract', '两年合约', '兩年合約', 'Contrat 2 ans', '2-Jahres-Vertrag', 'Contrato de 2 anos'],
  recommended:     ['★ RECOMMENDED', '★ 推荐', '★ 推薦', '★ RECOMMANDÉ', '★ EMPFOHLEN', '★ RECOMENDADO'],
  annualTotal:     ['Annual total', '年度总计', '年度總計', 'Total annuel', 'Jahresgesamt', 'Total anual'],
  renewsNote:      ['Renews at full price with annual uplift', '按全价续订，逐年上调', '按全價續訂，逐年上調', 'Renouvellement au prix plein avec hausse annuelle', 'Verlängerung zum vollen Preis mit jährlicher Erhöhung', 'Renova pelo preço integral com reajuste anual'],
  totalWord:       ['total', '总计', '總計', 'total', 'gesamt', 'total'],
  twoYearTotal:    ['2-year total', '两年总计', '兩年總計', 'Total sur 2 ans', '2-Jahres-Gesamt', 'Total de 2 anos'],
  savingNote:      ['Save {amt} in year one · rate locked for 24 months', '首年节省 {amt}·费率锁定 24 个月', '首年節省 {amt}·費率鎖定 24 個月', 'Économisez {amt} la 1re année · tarif bloqué 24 mois', '{amt} Ersparnis im 1. Jahr · Preis 24 Monate fix', 'Economize {amt} no 1º ano · tarifa fixa por 24 meses'],
  caption:         ['Commit to the 2-year contract to save {amt} in year one and lock your rate against annual uplifts.', '选择两年合约，首年即可节省 {amt}，并锁定费率、免受逐年上调影响。', '選擇兩年合約，首年即可節省 {amt}，並鎖定費率、免受逐年上調影響。', 'Optez pour le contrat de 2 ans afin d\'économiser {amt} la première année et de bloquer votre tarif contre les hausses annuelles.', 'Mit dem 2-Jahres-Vertrag sparen Sie {amt} im ersten Jahr und sichern Ihren Preis gegen jährliche Erhöhungen.', 'Opte pelo contrato de 2 anos para economizar {amt} no primeiro ano e travar sua tarifa contra reajustes anuais.'],
  captionNoSave:   ['The 2-year contract locks your rate for 24 months, protecting against annual uplifts.', '两年合约锁定费率 24 个月，免受逐年上调影响。', '兩年合約鎖定費率 24 個月，免受逐年上調影響。', 'Le contrat de 2 ans bloque votre tarif pendant 24 mois, à l\'abri des hausses annuelles.', 'Der 2-Jahres-Vertrag sichert Ihren Preis für 24 Monate gegen jährliche Erhöhungen.', 'O contrato de 2 anos trava sua tarifa por 24 meses, protegendo contra reajustes anuais.'],
  thProduct:       ['Product', '项目', '項目', 'Produit', 'Produkt', 'Produto'],
  thQty:           ['Qty', '数量', '數量', 'Qté', 'Menge', 'Qtd.'],
  thPrice:         ['Price', '价格', '價格', 'Prix', 'Preis', 'Preço'],
  thTotal:         ['Total', '总计', '總計', 'Total', 'Gesamt', 'Total'],
  backTitle:       ['For more information and FAQs', '了解更多信息与常见问题', '了解更多資訊與常見問題', 'Pour plus d\'informations et FAQ', 'Für weitere Informationen und FAQ', 'Para mais informações e perguntas frequentes'],
  backVisit:       ['Please visit chambers.com/faqs', '请访问 chambers.com/faqs', '請造訪 chambers.com/faqs', 'Rendez-vous sur chambers.com/faqs', 'Besuchen Sie chambers.com/faqs', 'Acesse chambers.com/faqs'],
  contactWord:     ['Contact:', '联系人：', '聯絡人：', 'Contact :', 'Kontakt:', 'Contato:'],
};

export function pptLabel(key: PptKey, lang: LangCode): string {
  const arr = PPT_I18N[key];
  if (!arr) return key;
  return arr[LANG_IDX[lang]] ?? arr[0];
}
