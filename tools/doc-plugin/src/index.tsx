import {
  Application,
  DeclarationReflection,
  DefaultThemeRenderContext,
  DefaultTheme,
  Options,
  JSX,
  PageEvent,
  Reflection,
  ReflectionKind,
  ReflectionGroup,
} from "typedoc";

export class NavigationOverrideThemeContext extends DefaultThemeRenderContext {
  constructor(theme: DefaultTheme, options: Options) {
    super(theme, options);

    this.navigation = (props) => {
      return (
        <>
          {overridePrimaryNavigation(this, props)}
        </>
      );
    };
  }
}

export class NavigationOverrideTheme extends DefaultTheme {
  private _contextCache?: NavigationOverrideThemeContext;

  override getRenderContext(): NavigationOverrideThemeContext {
    this._contextCache ||= new NavigationOverrideThemeContext(
      this,
      this.application.options
    );
    return this._contextCache;
  }
}

// Replicated from the TypeDoc codebase. This should be exported by TypeDoc.
function classNames(names: Record<string, boolean | null | undefined>, extraCss?: string) {
  const css = Object.keys(names)
    .filter((key) => names[key])
    .concat(extraCss || "")
    .join(" ")
    .trim()
    .replace(/\s+/g, " ");
  return css.length ? css : undefined;
}

function overridePrimaryNavigation(context: DefaultThemeRenderContext, props: PageEvent<Reflection>) {
  // TODO: We should filter out modules with <a href="_electron_forge_core._internal_.html"><internal></a>
  const modules = props.model.project.getChildrenByKind(ReflectionKind.SomeModule);
  const projectLinkName = modules.some((m) => m.kindOf(ReflectionKind.Module)) ? "All Modules" : "Exports";

  const groups = props.model.project.groups;

  if (groups && groups.length !== 0) {
    return (
      <nav class="tsd-navigation primary">
        <ul>
          <li class={classNames({ current: props.model.isProject() })}>
            <h3><a href={context.urlTo(props.model.project)}>{projectLinkName}</a></h3>
          </li>
          {groups.map(generateChildren)}
        </ul>
      </nav>
    );
  }

  return (
    <nav class="tsd-navigation primary">
      <ul>
        <li class={classNames({ current: props.model.isProject() })}>
          <a href={context.urlTo(props.model.project)}>{projectLinkName}</a>
        </li>
      </ul>
    </nav>
  );

  function generateChildren(group: ReflectionGroup) {
    let childNav: JSX.Element | undefined;
    if (group.children) {
      const title = group.title;
      if (group.children?.length) {
        childNav = <ul>{group.children.map(link)}</ul>;
      }

      return (
        <li class={title + " " + classNames({ current: props.model.isProject() })}>
          <h3>{title}</h3>
          {childNav}
        </li>
      );
    }
  }

  function link(mod: DeclarationReflection) {
    return (
      <li class={mod.name + " " + classNames({ current: props.model.isProject() })}>
        <a href={context.urlTo(mod)}>{renderedName(mod)}</a>
      </li>
    );
  }

  function renderedName(mod: DeclarationReflection) {
    return mod.name.split("/")[1];
  }
}

export function load(app: Application) {
  app.renderer.defineTheme("forge-theme", NavigationOverrideTheme);
}