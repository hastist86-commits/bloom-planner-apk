# Bloom Planner — نسخهٔ native Expo

این پوشه کلاینت native موبایل Bloom Planner است. رابط با React Native و Expo ساخته شده، RTL فارسی دارد و برای خانه، برنامه و تنظیمات به endpointهای واقعی backend Bloom Planner متصل می‌شود.

## اجرا

ابتدا وابستگی‌ها را نصب کنید:

```bash
pnpm install
```

برای اتصال به backend پایدار، متغیر محیطی زیر را تنظیم کنید:

```bash
EXPO_PUBLIC_API_URL=https://YOUR-BLOOM-DOMAIN.example
```

سپس اجرای Expo را انجام دهید:

```bash
pnpm exec expo start
```

## ساخت APK با EAS

پس از نصب EAS CLI و ورود به حساب Expo، از ریشهٔ پروژه اجرا کنید:

```bash
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build:configure
pnpm dlx eas-cli@latest build --platform android --profile preview
```

فایل `eas.json` از قبل profile `preview` را با `buildType: apk` تنظیم کرده است. پس از پایان build، EAS لینک دریافت APK را نمایش می‌دهد.

## نکتهٔ اتصال

اگر `EXPO_PUBLIC_API_URL` تنظیم نشود، پروژه از URL پیش‌فرض Preview استفاده می‌کند که برای آزمایش مناسب است و برای انتشار نهایی باید با دامنهٔ پایدار جایگزین شود. ورود Manus از داخل کلاینت native، صفحهٔ ورود وب Bloom Planner را باز می‌کند؛ برای تجربهٔ OAuth کاملاً native، callback deep-link باید در مرحلهٔ بعد به OAuth backend اضافه شود.
