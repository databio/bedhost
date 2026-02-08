# UMAP Embedding Navigation: Redirect to /umap Instead of Overlay

## Context

Feedback: the full-screen portal overlay when clicking compact UMAP embeddings feels like "opening a new window." The URL doesn't change, so the view can't be shared. We want clicking compact UMAP previews to navigate to the `/umap` page with URL params, making the experience feel like a single page and enabling shareable links.

## Approach

Add a new `navigateTo` prop to `EmbeddingContainer`. When set, clicking the compact view navigates to that URL instead of expanding. `blockCompact` behavior is unchanged. Additionally, add an "Open in /umap" link button in the **expanded** overlay toolbar for **all** views, so users can always get a shareable link.

## Changes

### 1. Add `navigateTo` prop to EmbeddingContainer (`ui/src/components/umap/embedding-container.tsx`)

- New optional prop: `navigateTo?: string`
- When `navigateTo` is set and the component is in `compact` state:
  - The `blockCompact` overlay click and the expand badge both navigate to `navigateTo` instead of calling `handleExpand`
  - Use `useNavigate()` from react-router-dom internally
- When `navigateTo` is not set, behavior is exactly the same as today

### 2. Add "Open in /umap" link in expanded toolbar

New optional prop: `umapUrl?: string`

In the expanded state toolbar, add a link badge visible in all expanded views.

### 3. Add `initialColorGrouping` prop to EmbeddingContainer

- New optional prop: `initialColorGrouping?: string`
- Use as initial value: `useState(initialColorGrouping || 'cell_line_category')`

### 4. Extend `/umap` page URL params (`ui/src/pages/bed-umap.tsx`)

Add support for: `center`, `colorGrouping`, `bedIds` URL params.

### 5. Consumer pages

- bed-splash: Add `navigateTo` and `umapUrl`
- home: Add `navigateTo` and `umapUrl`
- home_alt2: Add `navigateTo` and `umapUrl`
- bed2bed: Add `umapUrl` only (keep expand behavior)

## Files Modified

1. `ui/src/components/umap/embedding-container.tsx`
2. `ui/src/pages/bed-umap.tsx`
3. `ui/src/pages/bed-splash.tsx`
4. `ui/src/pages/home.tsx`
5. `ui/src/pages/home_alt2.tsx`
6. `ui/src/components/search/bed2bed/bed2bed.tsx`
