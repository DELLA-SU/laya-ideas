# HENA 열 가지

키워드에서 이미지와 읽을거리를 탐색하고, 자료를 저장하고, 두 아이디어를 연결하고, 무드보드로 정리하는 개인 영감 도구입니다.

공개 주소: https://della-su.github.io/laya-ideas/

GitHub Pages 공개 버전은 브라우저에서 접근 가능한 무료 API를 사용합니다. 서버가 필요한 Pinterest 인증 및 RSS 수집은 이 정적 배포에 포함되지 않습니다. 비밀 토큰을 저장소에 추가하지 마세요.


## Accumulated search results (2026-10-10)

Collected public previews are saved in this browser with IndexedDB, merged without duplicates, and reused before a new search finishes. Keeps up to 50 keywords, 240 preview candidates per keyword, for 30 days. The connection page shows the local saved counts. Image binaries and authentication tokens are not stored.

Shared server persistence is implemented and tested in the collection-server source, but has not been deployed: the existing Sites project is unavailable from the currently connected workspace. The public site continues using the existing collector and device-local storage until that project becomes accessible. Official Pinterest authentication is still pending Trial approval.


## Moustache Guy and Inspiration Flashlight (2026-10-10)

Uses the supplied off/on moustache bulb portraits as the fixed character. All result and editor surfaces are dark. The Inspiration Flashlight switch persists locally. Completed results receive a brief full preview before a soft circular pointer light reveals the masked grid. Supports touch and keyboard focus; the mask never intercepts clicks. Cards adapt to the visible viewport without result scrolling, with other candidates available through New Ideas.
