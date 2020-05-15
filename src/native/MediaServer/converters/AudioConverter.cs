namespace MediaServer.Converters
{
    using System;
    using System.IO;
    using System.Linq;
    using NAudio.Wave;

    public class AudioConverter
    {
        public static byte[] ResampleAudio(byte[] inputFrame, int inputSampleRate, int inputBitsPerSample, int inputChannelCount, int outSampleRate)
        {
            byte[] outFrame;

            if (inputSampleRate != outSampleRate)
            {
                IWaveProvider provider = new RawSourceWaveStream(new MemoryStream(inputFrame),
                    new WaveFormat(inputSampleRate, inputBitsPerSample, inputChannelCount));

                var outFormat = new WaveFormat(outSampleRate, provider.WaveFormat.Channels);

                using (var resampler = new MediaFoundationResampler(provider, outFormat))
                {
                    resampler.ResamplerQuality = 1;

                    int wavHeaderSize = 44;
                    int outBufferLength = outFormat.AverageBytesPerSecond / 100;
                    int wavBufferLength = outBufferLength + wavHeaderSize;
                    MemoryStream outStream = new MemoryStream(wavBufferLength);
                    WaveFileWriter.WriteWavFileToStream(outStream, resampler);

                    byte[] wavBytes = outStream.ToArray();
                    ArraySegment<byte> outArraySegment = new ArraySegment<byte>(wavBytes, wavHeaderSize, outBufferLength);
                    outFrame = outArraySegment.ToArray();
                }
            }
            else
            {
                outFrame = inputFrame;
            }

            return outFrame;
        }

        public static byte[] MergeFrames(byte[] frame1, byte[] frame2)
        {
            byte[] mergedFrames = new byte[frame1.Length + frame2.Length];

            frame1.CopyTo(mergedFrames, 0);
            frame2.CopyTo(mergedFrames, frame1.Length);

            return mergedFrames;
        }
    }
}