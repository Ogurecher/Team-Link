namespace MediaServer.Util
{
    using System;
    using System.Collections.Generic;
    public class FixedSizeQueue<T> : Queue<T>
    {
        private readonly object syncObject = new object();

        public int Size { get; private set; }

        public FixedSizeQueue(int size)
        {
            Size = size;
        }

        public new void Enqueue(T obj)
        {
            base.Enqueue(obj);

            if (base.Count > Size)
            {
                base.Dequeue();
            }
        }
    }
}
