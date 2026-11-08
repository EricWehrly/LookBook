import React from 'react';
import { fireEvent, render, screen, testUtils } from '../test-utils';
import Tags from '../../components/tags/tags';

describe('Tags', () => {
  beforeEach(() => {
    testUtils.clearStorage();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the label and add control with no tags', () => {
    const { container } = render(<Tags parentTypeName="look" parentId="p1" />);

    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(screen.getByText('add tag')).toBeInTheDocument();
    expect(container.querySelectorAll('.tag')).toHaveLength(1);
  });

  test('renders tags passed through props', () => {
    render(<Tags parentTypeName="look" parentId="p1" tags={['a', 'b']} />);

    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  test('loads tags previously stored for the parent', () => {
    testUtils.setMockStorageData('p1.tags', ['saved']);

    render(<Tags parentTypeName="look" parentId="p1" />);

    expect(screen.getByText('saved')).toBeInTheDocument();
  });

  test('tags from props win over stored tags', () => {
    testUtils.setMockStorageData('p1.tags', ['saved']);

    render(<Tags parentTypeName="look" parentId="p1" tags={['explicit']} />);

    expect(screen.getByText('explicit')).toBeInTheDocument();
    expect(screen.queryByText('saved')).not.toBeInTheDocument();
  });

  test('does not load tags stored for another parent', () => {
    testUtils.setMockStorageData('other.tags', ['theirs']);

    render(<Tags parentTypeName="look" parentId="p1" />);

    expect(screen.queryByText('theirs')).not.toBeInTheDocument();
  });

  test('ignores corrupt stored tags', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('p1.tags', '{nope');

    const { container } = render(<Tags parentTypeName="look" parentId="p1" />);

    expect(container.querySelectorAll('.tag')).toHaveLength(1);
  });

  test('ignores stored tags that are not a list, and drops non-string entries', () => {
    testUtils.setMockStorageData('p1.tags', { a: 1 });
    testUtils.setMockStorageData('p2.tags', ['ok', 3, null]);

    const first = render(<Tags parentTypeName="look" parentId="p1" />);
    expect(first.container.querySelectorAll('.tag')).toHaveLength(1);
    first.unmount();

    const second = render(<Tags parentTypeName="product" parentId="p2" />);
    expect(second.container.querySelectorAll('.tag')).toHaveLength(2);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  test('clicking add tag shows and persists a tag', () => {
    render(<Tags parentTypeName="look" parentId="p1" />);

    fireEvent.click(screen.getByText('add tag'));

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(testUtils.getMockStorageData('p1.tags')).toEqual(['test']);
  });

  test('adding a tag that already exists warns and changes nothing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Tags parentTypeName="look" parentId="p1" tags={['test']} />);

    fireEvent.click(screen.getByText('add tag'));

    expect(warn).toHaveBeenCalledWith('exists.');
    expect(screen.getAllByText('test')).toHaveLength(1);
    expect(testUtils.getMockStorageData('p1.tags')).toBeNull();
  });

  test('does not log when adding a tag', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<Tags parentTypeName="look" parentId="p1" />);

    fireEvent.click(screen.getByText('add tag'));

    expect(log).not.toHaveBeenCalled();
  });

  test('keeps the added tag on screen when storage rejects the write', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    render(<Tags parentTypeName="look" parentId="p1" />);

    fireEvent.click(screen.getByText('add tag'));

    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
