import React from 'react';
import { act, render, testUtils } from '../test-utils';
import Look from '../../components/looks/look';
import { LookOccurrence, Photo } from '../../components/looks/lookOccurrence';

function mount(look: Look, props: Partial<React.ComponentProps<typeof LookOccurrence>> = {}) {
  const ref = React.createRef<LookOccurrence>();
  const result = render(<LookOccurrence ref={ref} look={look} {...props} />);
  return { ref, ...result };
}

describe('LookOccurrence', () => {
  let look: Look;

  beforeEach(() => {
    testUtils.clearStorage();
    Look.Looks = {};
    look = new Look({ name: 'Occurrence Look', created: new Date('2023-04-01T10:00:00') });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('created', () => {
    test("defaults to the look's date", () => {
      const { ref } = mount(look);
      expect(ref.current!.created).toBe(look.created);
    });

    test('can be given its own date', () => {
      const day = new Date('2023-05-09T10:00:00');
      const { ref } = mount(look, { created: day });
      expect(ref.current!.created).toBe(day);
    });
  });

  describe('photos', () => {
    test('starts empty', () => {
      const { ref, container } = mount(look);

      expect(ref.current!.photos).toEqual([]);
      expect(container.querySelectorAll('.photo')).toHaveLength(0);
    });

    test('addPhoto renders the photo and persists it under the look and date', () => {
      const { ref, container } = mount(look);

      act(() => { ref.current!.addPhoto(new Photo({ id: 'p1', src: 'http://img/1' })); });

      expect(container.querySelectorAll('.photo')).toHaveLength(1);
      expect(testUtils.getMockStorageData(`${look.id}.${look.created}.photos`))
        .toEqual([{ id: 'p1', src: 'http://img/1' }]);
    });

    test('addPhoto appends to existing photos', () => {
      const { ref } = mount(look);

      act(() => { ref.current!.addPhoto(new Photo({ id: 'p1', src: 'a' })); });
      act(() => { ref.current!.addPhoto(new Photo({ id: 'p2', src: 'b' })); });

      expect(ref.current!.photos.map(p => p.id)).toEqual(['p1', 'p2']);
    });

    test('does not log when adding a photo', () => {
      const { ref } = mount(look);
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});

      act(() => { ref.current!.addPhoto(new Photo({ id: 'p1', src: 'a' })); });

      expect(log).not.toHaveBeenCalled();
    });

    test('loads photos stored for the same look and date', () => {
      testUtils.setMockStorageData(`${look.id}.${look.created}.photos`, [{ id: 'old', src: 'http://img/old' }]);

      const { ref, container } = mount(look);

      expect(ref.current!.photos).toEqual([{ id: 'old', src: 'http://img/old' }]);
      expect(container.querySelectorAll('.photo')).toHaveLength(1);
    });

    test('a later mount sees photos added by an earlier one', () => {
      const first = mount(look);
      act(() => { first.ref.current!.addPhoto(new Photo({ id: 'p1', src: 'a' })); });
      first.unmount();

      const second = mount(look);

      expect(second.ref.current!.photos.map(p => p.id)).toEqual(['p1']);
    });

    test('does not show photos stored for a different date', () => {
      testUtils.setMockStorageData(`${look.id}.${look.created}.photos`, [{ id: 'old', src: 'a' }]);

      const { ref } = mount(look, { created: new Date('2023-04-02T10:00:00') });

      expect(ref.current!.photos).toEqual([]);
    });

    test('ignores corrupt stored photos', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(`${look.id}.${look.created}.photos`, '{broken');

      const { ref } = mount(look);

      expect(ref.current!.photos).toEqual([]);
    });

    test('ignores stored photos that are not a list', () => {
      testUtils.setMockStorageData(`${look.id}.${look.created}.photos`, { id: 'x' });

      const { ref } = mount(look);

      expect(ref.current!.photos).toEqual([]);
    });

    test('still shows an added photo when storage rejects the write', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { ref, container } = mount(look);
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      });

      expect(() => {
        act(() => { ref.current!.addPhoto(new Photo({ id: 'p1', src: 'a' })); });
      }).not.toThrow();
      expect(container.querySelectorAll('.photo')).toHaveLength(1);
    });
  });

  describe('rendering', () => {
    test('sizes photos 240x240 by default', () => {
      testUtils.setMockStorageData(`${look.id}.${look.created}.photos`, [{ id: 'p', src: 'http://img/p' }]);

      const { container } = mount(look);

      const photo = container.querySelector('.photo') as HTMLElement;
      expect(photo.style.width).toBe('240px');
      expect(photo.style.height).toBe('240px');
      expect(photo.style.backgroundImage).toContain('http://img/p=w240-h240');
    });

    test('photo size can be set through props', () => {
      testUtils.setMockStorageData(`${look.id}.${look.created}.photos`, [{ id: 'p', src: 'http://img/p' }]);

      const { container } = mount(look, { photoWidth: 100, photoHeight: 150 });

      const photo = container.querySelector('.photo') as HTMLElement;
      expect(photo.style.width).toBe('100px');
      expect(photo.style.height).toBe('150px');
      expect(photo.style.backgroundImage).toContain('http://img/p=w100-h150');
    });
  });
});
