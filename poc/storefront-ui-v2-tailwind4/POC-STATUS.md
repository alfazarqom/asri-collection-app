# POC dependency correction

The first CI attempt confirmed that `@storefront-ui/react@3.0.0` is not published in the npm registry (ETARGET).

The dependency is now pinned to `@storefront-ui/react@3.1.0`. The upstream React changelog identifies 3.1.0 as the release immediately before 4.0.0's React 19 breaking change. The 3.0.0 source manifest declares peer dependency `react: ^18.3.1`, and the 3.0.0 Tailwind config source manifest declares Tailwind CSS 4 support.

This corrected package pin must still be confirmed by CI installation and production build before the POC can be considered successful.
