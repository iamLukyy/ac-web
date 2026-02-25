# i18n Admin Panel Design

## Scope
- Admin panel only (/admin/* pages + sidebar layout)
- Public page (index.vue) stays English-only

## Approach: Custom composable (no external dependency)

### New files
- app/composables/useLocale.ts - reactive locale ref + t() helper
- app/locales/en.json - English strings (~60 keys)
- app/locales/cs.json - Czech translations

### Composable API
- locale: Ref<en | cs> - persisted in localStorage, default en
- t(key: string): string - returns translation for current locale
- toggleLocale(): void - switches en/cs

### Language switcher
- Location: sidebar footer, above Back to site and Logout
- Icon: i-lucide-languages
- Label: shows current language name
- Click: toggleLocale()
- Same NavigationMenu component as other footer items

### Files to modify
- admin.vue (sidebar labels + footer switcher)
- All admin pages: index, server, track, cars, players, plugins, broadcast, templates, content, login
