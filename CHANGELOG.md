# unreleased

- Extends Promise global directly

_Breaking Changes _

- Drop browser support for Internet Explorer 11
- Requires a Promise global to be present before importing the module

# 0.4.1

- Fix issue where type definitions were not applied

# 0.4.0

- Add typescript types

# 0.3.1

- convert global to window (closes braintree-web#401)

# 0.3.0

- Add `suppressUnhandledPromiseMessage` option

# 0.2.1

- Limit promise method creation to known promise methods

# 0.2.0

- Allow ExtendedPromise to be a drop-in replacement for Promise

# 0.1.1

- Fix issue where instantitation would fail if Promise global did not exist

# 0.1.0

- Initial release
