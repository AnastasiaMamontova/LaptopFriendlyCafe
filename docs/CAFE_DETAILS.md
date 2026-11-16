# Compact cafe details and delete confirmation

The detail page follows the approved compact reference, without a cat emblem.
The app/launcher icon remains unchanged.

- A 140–170 px hero and small overlapping photo thumbnails reduce the gallery's
  height. Tapping either still opens the full-screen photo viewer.
- The cafe name uses 28 px type. District and personal rating share a line.
- Work essentials are plain two-column icon/text information, without filled
  tiles, rounded boxes or button behavior. Unknown availability and noise levels
  remain explicit.
- Description, address and hours use 16 px text. Hours remain on one horizontally
  scrollable line; long descriptions are retained and can scroll vertically.
- Directions and website remain separate 44 px minimum action buttons. Edit cafe
  and Delete are quiet text actions at the bottom.

With the short illustrative record used for screenshots, the complete page fits
at 390×844. At 320×740 it needs about 42 px of vertical scrolling. Long real-world
names, descriptions and addresses can require more space; no saved text is cut
or changed to force a single-screen layout.

## Delete confirmation

Delete opens a separate centered English alert dialog above the existing cafe:

> Delete this cafe?
>
> Are you sure you want to delete “Cafe name” and all its photos?
>
> This action cannot be undone.

The actions are **Cancel** and **Delete cafe**. Cancel receives initial keyboard
focus. Cancel, Escape or closing the dialog keeps the cafe, its current photo and
the detail page; keyboard focus returns to Delete. No deletion request is made
before explicit confirmation.

While deleting, the actions and close control are disabled and Escape cannot
dismiss the pending request. Failures leave the confirmation available for retry
or cancellation. A successful deletion returns to the collection.

## Screenshots

All screenshots use illustrative fixture data and local photos, without changing
production records:

- [Mobile details](screenshots/compact-details-mobile.png)
- [320 px details](screenshots/compact-details-small.png)
- [Desktop details](screenshots/compact-details-desktop.png)
- [Delete confirmation](screenshots/delete-confirmation-mobile.png)

These changes are included in [Android 1.0.6](ANDROID_RELEASE_1.0.6.md).
