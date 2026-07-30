import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Checkbox, Radio, Switch } from './ChoiceControls';
import { DateTimeInput } from './DateTimeInput';
import { Field, Input } from './Input';
import { Textarea } from './Textarea';

describe('form controls', () => {
  it('connects field description, error, invalid, and required semantics', () => {
    const html = renderToStaticMarkup(
      <Field label="Origin" description="Use HTTPS." error="Unavailable" required>
        {(id) => <Input id={id} />}
      </Field>,
    );

    expect(html).toContain('aria-describedby=');
    expect(html).toContain('-description');
    expect(html).toContain('-error');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain('/ required');
  });

  it('renders standardized textarea and date-time controls', () => {
    const textarea = renderToStaticMarkup(<Textarea aria-label="Message" />);
    const compactTextarea = renderToStaticMarkup(<Textarea aria-label="Compact message" autoGrow maxRows={4} />);
    const dateTime = renderToStaticMarkup(<DateTimeInput aria-label="Start time" />);
    expect(textarea).toContain('<textarea');
    expect(textarea).toContain('min-h-20');
    expect(compactTextarea).toContain('rows="1"');
    expect(compactTextarea).toContain('resize-none');
    expect(compactTextarea).toContain('min-h-9');
    expect(dateTime).toContain('type="datetime-local"');
    expect(dateTime).toContain('max-sm:h-10');
  });

  it('keeps checkbox and switch native, square, and explicitly labeled', () => {
    const checkbox = renderToStaticMarkup(<Checkbox label="Include archived" />);
    const toggle = renderToStaticMarkup(<Switch label="Always online" description="Keeps presence active." checked readOnly />);
    expect(checkbox).toContain('type="checkbox"');
    expect(checkbox).toContain('appearance-none');
    expect(toggle).toContain('role="switch"');
    expect(toggle).toContain('aria-labelledby=');
    expect(toggle).toContain('aria-describedby=');
    expect(toggle).toContain('checked=""');
    expect(toggle).toContain('peer-checked:after:translate-x-4');
  });

  it('exposes a native mixed checkbox state for page selection', () => {
    const checkbox = renderToStaticMarkup(<Checkbox label="Select this page" indeterminate />);
    expect(checkbox).toContain('aria-checked="mixed"');
    expect(checkbox).toContain('peer-indeterminate:bg-fg');
    expect(checkbox).toContain('peer-indeterminate:after:w-2');
  });

  it('keeps a table checkbox label accessible with the canonical touch target', () => {
    const checkbox = renderToStaticMarkup(<Checkbox label="Select Operations" visuallyHiddenLabel />);
    expect(checkbox).toContain('size-9');
    expect(checkbox).toContain('max-sm:size-10');
    expect(checkbox).toContain('sr-only');
    expect(checkbox).toContain('Select Operations');
  });

  it('renders a square native radio option', () => {
    const radio = renderToStaticMarkup(<Radio name="scope" value="admin" label="Admin" defaultChecked />);
    expect(radio).toContain('type="radio"');
    expect(radio).toContain('appearance-none');
    expect(radio).toContain('checked=""');
  });
});
