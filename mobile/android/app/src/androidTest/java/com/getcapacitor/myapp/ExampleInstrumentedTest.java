package com.AwakeHypnos.coffeehunter;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/** 验证安装后的 Android 应用使用约定的商店应用标识。 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // 从被测进程读取实际包名，避免仅验证构建脚本中的静态文本。
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.AwakeHypnos.coffeehunter", appContext.getPackageName());
    }
}
