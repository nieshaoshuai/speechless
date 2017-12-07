import { ExternalRecognition, Recognition } from '../src'
import { IWindow } from '../src/AbstractRecognition'
import { IExternalRecognitionState } from '../src/ExternalRecognition'
import { MediaStreamMock } from './__mocks__/MediaStreamMock'
import { AudioContextMock } from './__mocks__/AudioContextMock'
import { setTimeout } from 'timers'
import { Recorder } from 'web-recorder/dist/types/recorder'

let recognition: ExternalRecognition
let onEndCallback = jest.fn()
let onDataCallback = jest.fn()
let onStopCallback = jest.fn()
let onStartCallback = jest.fn()
let onFetchingCallback = jest.fn()
let onResultCallback = function onResult(blob: Blob) {
  return Promise.resolve('external')
}

describe('ExternalRecognition', () => {
  beforeEach(() => {
    ;(window as any).AudioContext = AudioContextMock

    delete (global as any).navigator
    ;(global as any).navigator = {
      getUserMedia: function(_, cb): MediaStream {
        return cb(new MediaStreamMock())
      }
    }
    recognition = Recognition('en', onResultCallback) as ExternalRecognition
    recognition.addEventListener('end', onEndCallback)
    recognition.addEventListener('data', onDataCallback)
    recognition.addEventListener('fetching', onFetchingCallback)
    recognition.addEventListener('stop', onStopCallback)
    recognition.addEventListener('start', onStartCallback)
  })

  afterEach(() => {
    onEndCallback.mockReset()
    onDataCallback.mockReset()
    onStopCallback.mockReset()
  })
  it('should set lang', () => {
    recognition = new ExternalRecognition('he', jest.fn())

    expect(recognition.getLang()).toEqual('he')
  })
  it('should start listening', () => {
    recognition.listen()
    const state: IExternalRecognitionState = recognition.getState()

    expect(state.listening).toBeTruthy()
  })
  it('should keep listening', () => {
    recognition.listen()
    recognition.listen()
    const state: IExternalRecognitionState = recognition.getState()

    expect(state.listening).toBeTruthy()
  })
  it('should stop listening', done => {
    recognition.listen()
    const recorder = recognition.getRecorder()
    recorder.abort()
    setImmediate(() => {
      const state: IExternalRecognitionState = recognition.getState()
      expect(onFetchingCallback).toBeCalled()
      expect(onDataCallback).toBeCalled()
      expect(onEndCallback).toBeCalled()
      expect(state.listening).toBeFalsy()
      done()
    })
  })
  it('should force stop listening', () => {
    recognition.listen()
    recognition.stop()
    const state: IExternalRecognitionState = recognition.getState()

    expect(onStopCallback).toBeCalled()
    expect(state.listening).toBeFalsy()
  })
  it('should do nothing if trying to stop a stopped listening', () => {
    const prevState: IExternalRecognitionState = recognition.getState()
    recognition.stop()
    const nextState: IExternalRecognitionState = recognition.getState()
    expect(prevState).toEqual(nextState)
    expect(onEndCallback).not.toBeCalled()
    expect(onStopCallback).not.toBeCalled()
    expect(onStartCallback).not.toBeCalled()
  })
  it("should not dispatch fetching if didn't set remoteCall", done => {
    recognition = Recognition('en') as ExternalRecognition

    recognition.addEventListener('fetching', onFetchingCallback)
    recognition.listen()
    const recorder = recognition.getRecorder()
    recorder.abort()
    setImmediate(() => {
      const state: IExternalRecognitionState = recognition.getState()
      expect(onFetchingCallback).toBeCalled()
      expect(state.listening).toBeFalsy()
      done()
    })
  })
})
