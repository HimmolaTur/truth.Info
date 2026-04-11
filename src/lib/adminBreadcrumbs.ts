export type AdminBreadcrumbItem = { href: string; label: string };

/**
 * Builds admin breadcrumb trail from a locale-stripped pathname (e.g. `/admin/news/edit/5`).
 */
export function getAdminBreadcrumbTrail(
  pathname: string,
  t: (key: string) => string
): AdminBreadcrumbItem[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "admin") {
    return [];
  }

  const out: AdminBreadcrumbItem[] = [{ href: "/admin", label: t("adminBreadcrumbHome") }];

  if (parts.length === 1) {
    return out;
  }

  let i = 1;
  while (i < parts.length) {
    const seg = parts[i];
    const hrefHere = `/${parts.slice(0, i + 1).join("/")}`;

    if (seg === "news") {
      out.push({ href: hrefHere, label: t("news") });
      i++;
    } else if (seg === "factcheck") {
      out.push({ href: hrefHere, label: t("factcheck") });
      i++;
    } else if (seg === "forum") {
      out.push({ href: hrefHere, label: t("forum") });
      i++;
    } else if (seg === "reports") {
      out.push({ href: hrefHere, label: t("reports") });
      i++;
    } else if (seg === "roles") {
      out.push({ href: hrefHere, label: t("adminRolesTitle") });
      i++;
    } else if (seg === "users") {
      out.push({ href: hrefHere, label: t("adminUsersTitle") });
      i++;
    } else if (seg === "new") {
      const parent = parts[i - 1];
      if (parent === "news") {
        out.push({ href: hrefHere, label: t("createNews") });
      } else if (parent === "factcheck") {
        out.push({ href: hrefHere, label: t("createFact") });
      } else if (parent === "roles") {
        out.push({ href: hrefHere, label: t("adminRolesCreate") });
      } else {
        out.push({ href: hrefHere, label: t("create") });
      }
      i++;
    } else if (seg === "edit") {
      const parent = parts[i - 1];
      const next = parts[i + 1];
      if (next && /^\d+$/.test(next)) {
        const fullHref = `/${parts.slice(0, i + 2).join("/")}`;
      if (parent === "news") {
        out.push({ href: fullHref, label: `${t("editNews")} #${next}` });
      } else if (parent === "factcheck") {
        out.push({ href: fullHref, label: `${t("editFact")} #${next}` });
      } else if (parent === "roles") {
        out.push({ href: fullHref, label: `${t("adminRolesEditTitle")} #${next}` });
      } else if (parent === "users") {
        out.push({ href: fullHref, label: `${t("adminUserEditTitle")} #${next}` });
      } else {
          out.push({ href: fullHref, label: `${t("edit")} #${next}` });
        }
        i += 2;
      } else {
        out.push({ href: hrefHere, label: t("edit") });
        i++;
      }
    } else if (/^\d+$/.test(seg)) {
      out.push({ href: hrefHere, label: `#${seg}` });
      i++;
    } else {
      out.push({ href: hrefHere, label: seg });
      i++;
    }
  }

  return out;
}
