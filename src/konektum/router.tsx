/**
 * Compatibility shim: exposes the react-router-dom API used by the original
 * Konektum code on top of TanStack Router.
 */
import * as React from "react";
import {
  Link as TanstackLink,
  useNavigate as useTanstackNavigate,
  useParams as useTanstackParams,
  useRouterState,
} from "@tanstack/react-router";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export interface LinkProps extends Omit<AnchorProps, "href"> {
  to: string;
  replace?: boolean;
  state?: unknown;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, state: _state, ...rest }, ref) => (
    <TanstackLink ref={ref} to={to} replace={replace} {...(rest as Record<string, unknown>)} />
  ),
);
Link.displayName = "Link";

export interface NavLinkProps extends Omit<AnchorProps, "href" | "className"> {
  to: string;
  end?: boolean;
  className?: string | ((state: { isActive: boolean; isPending: boolean }) => string);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, end, className, ...rest }, ref) => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
    const resolved =
      typeof className === "function" ? className({ isActive, isPending: false }) : className;
    return <TanstackLink ref={ref} to={to} className={resolved} {...(rest as Record<string, unknown>)} />;
  },
);
NavLink.displayName = "NavLink";

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return React.useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      void navigate({ to, replace: options?.replace });
    },
    [navigate],
  );
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return useTanstackParams({ strict: false } as never) as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, options?: { replace?: boolean }) => void,
] {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useTanstackNavigate();
  const params = React.useMemo(() => new URLSearchParams(search ?? ""), [search]);
  const setParams = React.useCallback(
    (next: URLSearchParams | Record<string, string>, options?: { replace?: boolean }) => {
      const usp = next instanceof URLSearchParams ? next : new URLSearchParams(next);
      const obj: Record<string, string> = {};
      usp.forEach((v, k) => {
        obj[k] = v;
      });
      void navigate({ to: ".", search: obj as never, replace: options?.replace });
    },
    [navigate],
  );
  return [params, setParams];
}
