namespace MediaServer.Converters
{
    using System;

    public class VideoConverter
    {
        public static byte[] I420ToNV12(byte[] i420Frame)
        {
            byte[] nv12Frame = new byte[i420Frame.Length];
            int pixelCount = i420Frame.Length * 8 / 12;
            
            Array.Copy(i420Frame, 0, nv12Frame, 0, pixelCount);

            for (int i = 0; i < pixelCount / 4; i++)
            {
                nv12Frame[pixelCount + i * 2] = i420Frame[pixelCount + i];
                nv12Frame[pixelCount + i * 2 + 1] = i420Frame[pixelCount + pixelCount / 4 + i];
            }

            return nv12Frame;
        }

        public static byte[] NV12ToI420(byte[] nv12Frame)
        {
            byte[] i420Frame = new byte[nv12Frame.Length];
            int pixelCount = nv12Frame.Length * 8 / 12;
            
            Array.Copy(nv12Frame, 0, i420Frame, 0, pixelCount);

            for (int i = 0; i < pixelCount / 4; i++)
            {
                i420Frame[pixelCount + i] = nv12Frame[pixelCount + i * 2];
                i420Frame[pixelCount + pixelCount / 4 + i] = nv12Frame[pixelCount + i * 2 + 1];
            }

            return i420Frame;
        }
    }
}
